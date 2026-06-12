import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum MessageType {
  TRANSFER_SUBMITTED = 'transfer_submitted',
  TRANSFER_APPROVED = 'transfer_approved',
  TRANSFER_REJECTED = 'transfer_rejected',
  TRANSFER_SHIPPED = 'transfer_shipped',
  TRANSFER_RECEIVED = 'transfer_received',
  LOGISTICS_TIMEOUT = 'logistics_timeout',
  SYSTEM = 'system',
}

export enum MessageChannel {
  IN_APP = 'in_app',
  PUSH = 'push',
  EMAIL = 'email',
}

@Entity('messages')
@Index(['recipientId', 'read', 'createdAt'])
@Index(['recipientId', 'createdAt'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.SYSTEM,
  })
  type: MessageType;

  @Column()
  recipientId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'recipientId' })
  recipient: User;

  @Column({ length: 200 })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'jsonb', nullable: true })
  metaData?: Record<string, any>;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'timestamp', nullable: true })
  readAt?: Date;

  @Column({
    type: 'enum',
    enum: MessageChannel,
    default: MessageChannel.IN_APP,
  })
  channel: MessageChannel;

  @Column({ type: 'uuid', nullable: true })
  transferId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  transferNo?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
