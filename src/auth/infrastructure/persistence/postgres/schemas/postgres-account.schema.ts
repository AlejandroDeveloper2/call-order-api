import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
} from 'typeorm';

import { PostgresUserSchema } from '../../../../../users/infrastructure/persistence/postgres/schemas';

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

  @Column({ type: 'date', nullable: true })
  lastLoginAt?: Date;

  @Column()
  failedAttempts!: number;

  @Column({ type: 'date', nullable: true })
  lockedUtil?: Date;

  @OneToOne(() => PostgresUserSchema, (profile) => profile.account, {
    onDelete: 'NO ACTION',
  })
  profile!: PostgresUserSchema;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
