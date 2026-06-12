import {
  Injectable,
  Inject,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource, QueryRunner } from 'typeorm';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import { Transfer } from './entities/transfer.entity';
import { TransferItem } from './entities/transfer-item.entity';
import {
  CreateTransferDto,
  UpdateTransferDto,
  ApproveTransferDto,
  ShipTransferDto,
  QueryTransferDto,
} from './dto/transfer.dto';
import { TransferStatus, TRANSFER_STATUS_FLOW } from '../common/enums';
import { UserRole } from '../common/enums';
import {
  DuplicateTransferException,
  TransferNotFoundException,
  InvalidStatusTransitionException,
  OptimisticLockException,
} from '../common/exceptions/business.exceptions';
import { User } from '../users/entities/user.entity';
import { AuditService } from '../audit/audit.service';
import { MessagesService } from '../messages/messages.service';
import { MessageType } from '../messages/entities/message.entity';
import { UsersService } from '../users/users.service';
import { WarehousesService } from '../warehouses/warehouses.service';

const ACTIVE_STATUSES = [
  TransferStatus.DRAFT,
  TransferStatus.PENDING_APPROVAL,
  TransferStatus.PENDING_SHIPMENT,
  TransferStatus.IN_TRANSIT,
];

@Injectable()
export class TransfersService {
  constructor(
    @InjectRepository(Transfer)
    private transfersRepository: Repository<Transfer>,
    @InjectRepository(TransferItem)
    private transferItemsRepository: Repository<TransferItem>,
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
    private dataSource: DataSource,
    private auditService: AuditService,
    private messagesService: MessagesService,
    private usersService: UsersService,
    private warehousesService: WarehousesService,
  ) {}

  private generateTransferNo(): string {
    const date = new Date();
    const dateStr = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
    const random = Math.floor(100000 + Math.random() * 900000);
    return `TR${dateStr}${random}`;
  }

  private async acquireLock(key: string, timeout = 5000): Promise<string | null> {
    const lockValue = uuidv4();
    const result = await this.redis.set(key, lockValue, 'PX', timeout, 'NX');
    return result === 'OK' ? lockValue : null;
  }

  private async releaseLock(key: string, lockValue: string): Promise<void> {
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    await this.redis.eval(script, 1, key, lockValue);
  }

  private canTransition(from: TransferStatus, to: TransferStatus): boolean {
    return TRANSFER_STATUS_FLOW[from]?.includes(to) ?? false;
  }

  private async afterStatusTransition(
    transfer: Transfer,
    oldStatus: TransferStatus,
    newStatus: TransferStatus,
    operator: User,
    remark?: string,
  ): Promise<void> {
    try {
      await this.auditService.logStatusChange(
        transfer.id,
        transfer.transferNo,
        oldStatus,
        newStatus,
        operator.id,
        operator.realName,
        operator.role,
        remark,
      );

      await this.sendNotificationForStatusChange(transfer, oldStatus, newStatus, operator);
    } catch (error) {
      console.error('Failed to log status change or send notification:', error);
    }
  }

  private async sendNotificationForStatusChange(
    transfer: Transfer,
    oldStatus: TransferStatus,
    newStatus: TransferStatus,
    operator: User,
  ): Promise<void> {
    const transferWithRelations = await this.transfersRepository.findOne({
      where: { id: transfer.id },
      relations: ['sourceWarehouse', 'targetWarehouse', 'applicant'],
    });

    if (!transferWithRelations) return;

    const metaData = {
      transferId: transfer.id,
      transferNo: transfer.transferNo,
      oldStatus,
      newStatus,
      operatorId: operator.id,
      operatorName: operator.realName,
    };

    const transition = `${oldStatus}->${newStatus}`;

    switch (transition) {
      case 'draft->pending_approval':
      case 'create->pending_approval':
        await this.messagesService.sendTransferNotification(
          MessageType.TRANSFER_SUBMITTED,
          [UserRole.FINANCE, UserRole.REGION_MANAGER],
          `调拨申请待审核: ${transfer.transferNo}`,
          `${operator.realName} 提交了调拨申请 ${transfer.transferNo}，请及时审核。\n调出仓库: ${transferWithRelations.sourceWarehouse?.name}\n调入仓库: ${transferWithRelations.targetWarehouse?.name}\n数量: ${transfer.quantity}`,
          metaData,
          transfer.id,
          transfer.transferNo,
        );
        break;

      case 'pending_approval->pending_shipment':
        if (transferWithRelations.applicantId) {
          await this.messagesService.sendTransferNotificationToUser(
            MessageType.TRANSFER_APPROVED,
            transferWithRelations.applicantId,
            `调拨申请已通过: ${transfer.transferNo}`,
            `您的调拨申请 ${transfer.transferNo} 已被 ${operator.realName} 审核通过，等待出库。`,
            metaData,
            transfer.id,
            transfer.transferNo,
          );
        }
        break;

      case 'pending_approval->rejected':
        if (transferWithRelations.applicantId) {
          await this.messagesService.sendTransferNotificationToUser(
            MessageType.TRANSFER_REJECTED,
            transferWithRelations.applicantId,
            `调拨申请已驳回: ${transfer.transferNo}`,
            `您的调拨申请 ${transfer.transferNo} 已被 ${operator.realName} 驳回。\n驳回原因: ${transfer.rejectionReason || '未填写'}`,
            metaData,
            transfer.id,
            transfer.transferNo,
          );
        }
        break;

      case 'pending_shipment->in_transit':
        await this.messagesService.sendTransferNotification(
          MessageType.TRANSFER_SHIPPED,
          [UserRole.WAREHOUSE_KEEPER],
          `调拨已出库: ${transfer.transferNo}`,
          `调拨申请 ${transfer.transferNo} 已出库。\n物流: ${transfer.logisticsCompany}\n运单号: ${transfer.trackingNo}\n请 ${transferWithRelations.targetWarehouse?.name} 仓管注意查收。`,
          metaData,
          transfer.id,
          transfer.transferNo,
        );
        break;

      case 'in_transit->completed':
        await this.messagesService.sendTransferNotification(
          MessageType.TRANSFER_RECEIVED,
          [UserRole.WAREHOUSE_KEEPER, UserRole.REGION_MANAGER],
          `调拨已入库: ${transfer.transferNo}`,
          `调拨申请 ${transfer.transferNo} 已确认入库。\n${transferWithRelations.targetWarehouse?.name} 已签收。`,
          metaData,
          transfer.id,
          transfer.transferNo,
        );
        break;
    }
  }

  private async checkDuplicate(
    skuId: string,
    batchNo: string,
    excludeId?: string,
  ): Promise<void> {
    const where: any = {
      skuId,
      batchNo,
      status: In(ACTIVE_STATUSES),
    };
    if (excludeId) {
      where.id = { $ne: excludeId } as any;
    }
    const existing = await this.transfersRepository.findOne({ where });
    if (existing && existing.id !== excludeId) {
      throw new DuplicateTransferException(skuId, batchNo);
    }
  }

  async create(createTransferDto: CreateTransferDto, user: User): Promise<Transfer> {
    if (createTransferDto.sourceWarehouseId === createTransferDto.targetWarehouseId) {
      throw new BadRequestException('调出仓库和调入仓库不能相同');
    }

    const lockKey = `transfer:lock:${createTransferDto.skuId}:${createTransferDto.batchNo}`;
    const lockValue = await this.acquireLock(lockKey, 10000);
    if (!lockValue) {
      throw new DuplicateTransferException(createTransferDto.skuId, createTransferDto.batchNo);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.checkDuplicate(createTransferDto.skuId, createTransferDto.batchNo);

      let transferNo = this.generateTransferNo();
      while (await this.transfersRepository.findOne({ where: { transferNo } })) {
        transferNo = this.generateTransferNo();
      }

      const transfer = queryRunner.manager.create(Transfer, {
        ...createTransferDto,
        transferNo,
        applicantId: user.id,
        status: createTransferDto.submitForApproval
          ? TransferStatus.PENDING_APPROVAL
          : TransferStatus.DRAFT,
      });

      const savedTransfer = await queryRunner.manager.save(transfer);

      const item = queryRunner.manager.create(TransferItem, {
        transferId: savedTransfer.id,
        skuId: createTransferDto.skuId,
        batchNo: createTransferDto.batchNo,
        quantity: createTransferDto.quantity,
      });
      await queryRunner.manager.save(item);

      await queryRunner.commitTransaction();

      const result = await this.transfersRepository.findOne({
        where: { id: savedTransfer.id },
        relations: ['sourceWarehouse', 'targetWarehouse', 'applicant'],
      });

      if (result && createTransferDto.submitForApproval) {
        await this.afterStatusTransition(
          result,
          TransferStatus.DRAFT,
          TransferStatus.PENDING_APPROVAL,
          user,
          '创建时直接提交审核',
        );
      }

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
      if (lockValue) {
        await this.releaseLock(lockKey, lockValue);
      }
    }
  }

  async findAll(
    query: QueryTransferDto,
    page = 1,
    limit = 20,
  ): Promise<{ data: Transfer[]; total: number }> {
    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.sourceWarehouseId) where.sourceWarehouseId = query.sourceWarehouseId;
    if (query.targetWarehouseId) where.targetWarehouseId = query.targetWarehouseId;
    if (query.skuId) where.skuId = query.skuId;
    if (query.applicantId) where.applicantId = query.applicantId;
    if (query.transferNo) where.transferNo = query.transferNo;

    const [data, total] = await this.transfersRepository.findAndCount({
      where,
      relations: ['sourceWarehouse', 'targetWarehouse', 'applicant', 'approver'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  async findOne(id: string): Promise<Transfer> {
    const transfer = await this.transfersRepository.findOne({
      where: { id },
      relations: [
        'sourceWarehouse',
        'targetWarehouse',
        'applicant',
        'approver',
        'items',
        'items.sku',
      ],
    });
    if (!transfer) {
      throw new TransferNotFoundException(id);
    }
    return transfer;
  }

  async update(id: string, updateTransferDto: UpdateTransferDto, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的申请可以修改');
    }

    if (transfer.applicantId !== user.id && user.role !== UserRole.REGION_MANAGER) {
      throw new BadRequestException('只能修改自己创建的申请');
    }

    const skuId = updateTransferDto.skuId || transfer.skuId;
    const batchNo = updateTransferDto.batchNo || transfer.batchNo;

    if (skuId !== transfer.skuId || batchNo !== transfer.batchNo) {
      await this.checkDuplicate(skuId, batchNo, id);
    }

    Object.assign(transfer, updateTransferDto);
    transfer.updatedAt = new Date();

    return this.transfersRepository.save(transfer);
  }

  async submitForApproval(id: string, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);
    const oldStatus = transfer.status;

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的申请可以提交审核');
    }

    if (!this.canTransition(transfer.status, TransferStatus.PENDING_APPROVAL)) {
      throw new InvalidStatusTransitionException(transfer.status, TransferStatus.PENDING_APPROVAL);
    }

    transfer.status = TransferStatus.PENDING_APPROVAL;
    const result = await this.transfersRepository.save(transfer);

    await this.afterStatusTransition(result, oldStatus, TransferStatus.PENDING_APPROVAL, user);

    return result;
  }

  async approve(
    id: string,
    approveDto: ApproveTransferDto,
    user: User,
  ): Promise<Transfer> {
    if (user.role !== UserRole.REGION_MANAGER && user.role !== UserRole.FINANCE) {
      throw new BadRequestException('只有区域经理或财务可以审核');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const transfer = await queryRunner.manager.findOne(Transfer, {
        where: { id },
      });
      if (!transfer) {
        throw new TransferNotFoundException(id);
      }

      const oldStatus = transfer.status;

      if (transfer.status !== TransferStatus.PENDING_APPROVAL) {
        throw new BadRequestException('只有待审核状态的申请可以审批');
      }

      if (transfer.version !== approveDto.version) {
        await queryRunner.rollbackTransaction();
        const latest = await this.transfersRepository.findOne({
          where: { id },
          relations: ['sourceWarehouse', 'targetWarehouse', 'applicant', 'approver'],
        });
        throw new OptimisticLockException(latest);
      }

      if (!this.canTransition(transfer.status, approveDto.decision)) {
        throw new InvalidStatusTransitionException(transfer.status, approveDto.decision);
      }

      if (approveDto.decision === TransferStatus.REJECTED && !approveDto.rejectionReason) {
        throw new BadRequestException('驳回时必须填写驳回原因');
      }

      transfer.status = approveDto.decision;
      transfer.approverId = user.id;
      transfer.approvedAt = new Date();
      if (approveDto.rejectionReason) {
        transfer.rejectionReason = approveDto.rejectionReason;
      }

      const saved = await queryRunner.manager.save(transfer);
      await queryRunner.commitTransaction();

      const result = await this.transfersRepository.findOne({
        where: { id: saved.id },
        relations: ['sourceWarehouse', 'targetWarehouse', 'applicant', 'approver'],
      });

      if (result) {
        await this.afterStatusTransition(
          result,
          oldStatus,
          approveDto.decision,
          user,
          approveDto.rejectionReason,
        );
      }

      return result!;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async ship(id: string, shipDto: ShipTransferDto, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);
    const oldStatus = transfer.status;

    if (transfer.status !== TransferStatus.PENDING_SHIPMENT) {
      throw new BadRequestException('只有待出库状态的申请可以发货');
    }

    if (!this.canTransition(transfer.status, TransferStatus.IN_TRANSIT)) {
      throw new InvalidStatusTransitionException(transfer.status, TransferStatus.IN_TRANSIT);
    }

    transfer.status = TransferStatus.IN_TRANSIT;
    transfer.shippedAt = new Date();
    transfer.logisticsCompany = shipDto.logisticsCompany;
    transfer.trackingNo = shipDto.trackingNo;

    const result = await this.transfersRepository.save(transfer);

    await this.afterStatusTransition(result, oldStatus, TransferStatus.IN_TRANSIT, user);

    return result;
  }

  async receive(id: string, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);
    const oldStatus = transfer.status;

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('只有在途状态的申请可以确认入库');
    }

    if (!this.canTransition(transfer.status, TransferStatus.COMPLETED)) {
      throw new InvalidStatusTransitionException(transfer.status, TransferStatus.COMPLETED);
    }

    transfer.status = TransferStatus.COMPLETED;
    transfer.receivedAt = new Date();

    const result = await this.transfersRepository.save(transfer);

    await this.afterStatusTransition(result, oldStatus, TransferStatus.COMPLETED, user);

    return result;
  }

  async remove(id: string, user: User): Promise<void> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.DRAFT && transfer.status !== TransferStatus.REJECTED) {
      throw new BadRequestException('只有草稿或驳回状态的申请可以删除');
    }

    if (transfer.applicantId !== user.id && user.role !== UserRole.REGION_MANAGER) {
      throw new BadRequestException('只能删除自己创建的申请');
    }

    await this.transfersRepository.delete(id);
  }

  async findInTransitWithTimeout(timeoutSeconds: number): Promise<Transfer[]> {
    const cutoff = new Date(Date.now() - timeoutSeconds * 1000);
    return this.transfersRepository
      .createQueryBuilder('transfer')
      .leftJoinAndSelect('transfer.logisticsTrackings', 'tracking')
      .where('transfer.status = :status', { status: TransferStatus.IN_TRANSIT })
      .andWhere((qb) => {
        const subQuery = qb
          .subQuery()
          .select('MAX(lt.timestamp)')
          .from('logistics_tracking', 'lt')
          .where('lt.transferId = transfer.id')
          .getQuery();
        return `(${subQuery} IS NULL OR ${subQuery} < :cutoff)`;
      })
      .setParameter('cutoff', cutoff)
      .getMany();
  }
}
