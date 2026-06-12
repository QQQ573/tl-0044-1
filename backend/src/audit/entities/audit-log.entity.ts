import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  SUBMIT = 'submit',
  APPROVE = 'approve',
  REJECT = 'reject',
  SHIP = 'ship',
  RECEIVE = 'receive',
  DELETE = 'delete',
  LOGISTICS_UPDATE = 'logistics_update',
  ATTACHMENT_UPLOAD = 'attachment_upload',
  ATTACHMENT_DELETE = 'attachment_delete',
}

@Entity('audit_logs')
@Index(['transferId', 'createdAt'])
@Index(['userId', 'createdAt'])
export class AuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column('uuid', { nullable: true })
  transferId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  transferNo?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  oldStatus?: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  newStatus?: string;

  @Column('uuid', { nullable: true })
  userId?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userName?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  userRole?: string;

  @Column({ type: 'text', nullable: true })
  remark?: string;

  @Column({ type: 'jsonb', nullable: true })
  metaData?: Record<string, any>;

  @Column({ type: 'varchar', length: 50, nullable: true })
  ipAddress?: string;

  @CreateDateColumn()
  createdAt: Date;
}
