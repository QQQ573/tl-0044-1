import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('skus')
export class Sku {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  skuCode: string;

  @Column()
  skuName: string;

  @Column()
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
