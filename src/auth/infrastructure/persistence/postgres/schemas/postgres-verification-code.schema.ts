import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { VerificationCodeType } from '../../../../domain/types';

import { PostgresAccountSchema } from './postgres-account.schema';

@Entity('verification_codes')
export class PostgresVerificationCodeSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => PostgresAccountSchema, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'accountId' })
  account!: PostgresAccountSchema;

  @Column()
  accountId!: string;

  @Column()
  codeHash!: string;

  @Column({ enum: ['double-factor'], default: 'double-factor' })
  type!: VerificationCodeType;

  @Column({ type: 'date' })
  expiresAt!: Date;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ type: 'date', nullable: true })
  usedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
