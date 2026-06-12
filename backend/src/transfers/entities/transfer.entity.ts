import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TransferStatus } from '../../common/enums';
import { TransferItem } from './transfer-item.entity';
import { User } from '../../users/entities/user.entity';
import { Warehouse } from '../../warehouses/entities/warehouse.entity';

@Entity('transfers')
@Index(['skuId', 'batchNo', 'status'], { unique: false })
export class Transfer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  transferNo: string;

  @Column({
    type: 'enum',
    enum: TransferStatus,
    default: TransferStatus.DRAFT,
  })
  status: TransferStatus;

  @Column()
  sourceWarehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'sourceWarehouseId' })
  sourceWarehouse: Warehouse;

  @Column()
  targetWarehouseId: string;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'targetWarehouseId' })
  targetWarehouse: Warehouse;

  @Column('uuid')
  skuId: string;

  @Column()
  batchNo: string;

  @Column('int')
  quantity: number;

  @Column({ type: 'text', nullable: true })
  reason: string;

  @Column({ type: 'text', nullable: true })
  remark: string;

  @Column({ nullable: true })
  applicantId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'applicantId' })
  applicant: User;

  @Column({ nullable: true })
  approverId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'approverId' })
  approver: User;

  @Column({ type: 'timestamp', nullable: true })
  approvedAt: Date;

  @Column({ nullable: true })
  rejectionReason: string;

  @Column({ type: 'timestamp', nullable: true })
  shippedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  receivedAt: Date;

  @Column({ type: 'text', nullable: true })
  logisticsCompany: string;

  @Column({ nullable: true })
  trackingNo: string;

  @OneToMany(() => TransferItem, (item) => item.transfer, { cascade: true })
  items: TransferItem[];

  @VersionColumn()
  version: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
