import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';

import { PostgresUserSchema } from '../../../../../users/infrastructure/persistence/postgres/schemas';

import { PostgresVerificationCodeSchema } from './postgres-verification-code.schema';
import { PostgresSessionSchema } from './postgres-session.schema';

@Entity('accounts')
export class PostgresAccountSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({ default: false })
  mustChangePassword!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastLoginAt?: Date;

  @Column()
  failedAttempts!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lockedUntil?: Date;

  @OneToOne(() => PostgresUserSchema, {
    onDelete: 'NO ACTION',
    // eager: true,
  })
  @JoinColumn({ name: 'profileId' })
  profile!: PostgresUserSchema;

  @Column()
  profileId!: string;

  @OneToMany(() => PostgresVerificationCodeSchema, (code) => code.account, {
    onDelete: 'NO ACTION',
    // eager: true,
  })
  verificationCodes!: PostgresVerificationCodeSchema[];

  @OneToMany(() => PostgresSessionSchema, (session) => session.account, {
    onDelete: 'NO ACTION',
    // eager: true,
  })
  sessions!: PostgresSessionSchema[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
