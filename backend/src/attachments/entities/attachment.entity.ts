import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fileName: string;

  @Column()
  originalName: string;

  @Column()
  mimeType: string;

  @Column('bigint')
  size: number;

  @Column()
  bucketName: string;

  @Column()
  objectKey: string;

  @Column({ nullable: true })
  transferId: string;

  @Column({ nullable: true })
  uploadedById: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploadedById' })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
