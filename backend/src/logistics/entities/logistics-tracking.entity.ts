import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Transfer } from '../../transfers/entities/transfer.entity';

@Entity('logistics_tracking')
@Index(['transferId', 'timestamp'])
export class LogisticsTracking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  transferId: string;

  @ManyToOne(() => Transfer)
  @JoinColumn({ name: 'transferId' })
  transfer: Transfer;

  @Column({ type: 'timestamp' })
  timestamp: Date;

  @Column()
  location: string;

  @Column({ nullable: true })
  latitude: string;

  @Column({ nullable: true })
  longitude: string;

  @Column({ type: 'text' })
  status: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  operator: string;

  @CreateDateColumn()
  createdAt: Date;
}
