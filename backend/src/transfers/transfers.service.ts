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

      return this.transfersRepository.findOne({
        where: { id: savedTransfer.id },
        relations: ['sourceWarehouse', 'targetWarehouse', 'applicant'],
      });
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

    if (transfer.status !== TransferStatus.DRAFT) {
      throw new BadRequestException('只有草稿状态的申请可以提交审核');
    }

    if (!this.canTransition(transfer.status, TransferStatus.PENDING_APPROVAL)) {
      throw new InvalidStatusTransitionException(transfer.status, TransferStatus.PENDING_APPROVAL);
    }

    transfer.status = TransferStatus.PENDING_APPROVAL;
    return this.transfersRepository.save(transfer);
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

      const result = await queryRunner.manager.save(transfer);
      await queryRunner.commitTransaction();

      return this.transfersRepository.findOne({
        where: { id: result.id },
        relations: ['sourceWarehouse', 'targetWarehouse', 'applicant', 'approver'],
      });
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async ship(id: string, shipDto: ShipTransferDto, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);

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

    return this.transfersRepository.save(transfer);
  }

  async receive(id: string, user: User): Promise<Transfer> {
    const transfer = await this.findOne(id);

    if (transfer.status !== TransferStatus.IN_TRANSIT) {
      throw new BadRequestException('只有在途状态的申请可以确认入库');
    }

    if (!this.canTransition(transfer.status, TransferStatus.COMPLETED)) {
      throw new InvalidStatusTransitionException(transfer.status, TransferStatus.COMPLETED);
    }

    transfer.status = TransferStatus.COMPLETED;
    transfer.receivedAt = new Date();

    return this.transfersRepository.save(transfer);
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
