import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Transfer } from './transfer.entity';
import { Sku } from '../../skus/entities/sku.entity';

@Entity('transfer_items')
export class TransferItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transferId: string;

  @ManyToOne(() => Transfer, (transfer) => transfer.items)
  @JoinColumn({ name: 'transferId' })
  transfer: Transfer;

  @Column()
  skuId: string;

  @ManyToOne(() => Sku)
  @JoinColumn({ name: 'skuId' })
  sku: Sku;

  @Column()
  batchNo: string;

  @Column('int')
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitPrice: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
