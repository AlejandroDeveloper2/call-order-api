import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PostgresAccountSchema } from './postgres-account.schema';

@Entity('sessions')
export class PostgresSessionSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PostgresAccountSchema, (account) => account.sessions, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'accountId' })
  account!: PostgresAccountSchema;

  @Column({ type: 'uuid' })
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

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'timestamptz' })
  lastActivityAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  revokedAt?: Date;

  @Column({ nullable: true })
  deviceName?: string;

  @Column({ nullable: true })
  deviceType?: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
