import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
import { CreateAuditLogDto, QueryAuditLogDto } from './dto/audit-log.dto';

@Injectable()
export class AuditService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  async create(dto: CreateAuditLogDto): Promise<AuditLog> {
    const log = this.auditLogRepository.create(dto);
    return this.auditLogRepository.save(log);
  }

  async findByTransferId(
    transferId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const [data, total] = await this.auditLogRepository.findAndCount({
      where: { transferId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async findAll(
    query: QueryAuditLogDto,
    page = 1,
    limit = 20,
  ): Promise<{ data: AuditLog[]; total: number }> {
    const where: any = {};
    if (query.transferId) where.transferId = query.transferId;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;

    const [data, total] = await this.auditLogRepository.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total };
  }

  async logStatusChange(
    transferId: string,
    transferNo: string,
    oldStatus: string,
    newStatus: string,
    userId?: string,
    userName?: string,
    userRole?: string,
    remark?: string,
  ): Promise<AuditLog> {
    const actionMap: Record<string, AuditAction> = {
      'draft->pending_approval': AuditAction.SUBMIT,
      'pending_approval->pending_shipment': AuditAction.APPROVE,
      'pending_approval->rejected': AuditAction.REJECT,
      'pending_shipment->in_transit': AuditAction.SHIP,
      'in_transit->completed': AuditAction.RECEIVE,
    };

    const key = `${oldStatus}->${newStatus}`;
    const action = actionMap[key] || AuditAction.UPDATE;

    return this.create({
      action,
      transferId,
      transferNo,
      oldStatus,
      newStatus,
      userId,
      userName,
      userRole,
      remark,
    });
  }
}
