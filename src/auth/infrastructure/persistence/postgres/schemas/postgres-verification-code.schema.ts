import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import type { VerificationCodeType } from '../../../../domain/types';

import { PostgresAccountSchema } from './postgres-account.schema';

@Entity('verification_codes')
export class PostgresVerificationCodeSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(
    () => PostgresAccountSchema,
    (account) => account.verificationCodes,
    { onDelete: 'NO ACTION' },
  )
  @JoinColumn({ name: 'accountId' })
  account!: PostgresAccountSchema;

  @Column({ type: 'uuid' })
  accountId!: string;

  @Column()
  codeHash!: string;

  @Index(['accountId', 'codeLookup'])
  @Column({ length: 64 })
  codeLookup!: string;

  @Column({ enum: ['double-factor'], default: 'double-factor' })
  type!: VerificationCodeType;

  @Column({ type: 'timestamptz', nullable: false })
  expiresAt!: Date;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
