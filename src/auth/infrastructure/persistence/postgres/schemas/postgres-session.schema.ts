import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { PostgresAccountSchema } from './postgres-account.schema';

@Entity('sessions')
export class PostgresSessionSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => PostgresAccountSchema, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'accountId' })
  account!: PostgresAccountSchema;

  @Column()
  accountId!: string;

  @Column()
  tokenHash!: string;

  @Column()
  refreshTokenHash!: string;

  @Column({ nullable: true })
  browser?: string;

  @Column({ nullable: true })
  operatingSystem?: string;

  @Column({ nullable: true })
  ipAddress?: string;

  @Column({ nullable: true })
  userAgent?: string;

  @Column({ type: 'date' })
  expiresAt!: Date;

  @Column({ type: 'date' })
  lastActivityAt!: Date;

  @Column({ type: 'date', nullable: true })
  revokedAt?: Date;

  @Column({ nullable: true })
  deviceName?: string;

  @Column({ nullable: true })
  deviceType?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
