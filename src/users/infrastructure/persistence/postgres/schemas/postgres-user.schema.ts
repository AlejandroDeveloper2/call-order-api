import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  OneToOne,
} from 'typeorm';

import { PostgresAccountSchema } from '../../../../../auth/infrastructure/persistence/postgres/schemas';
import { PostgresRoleSchema } from './postgres-role.schema';

@Entity('users')
export class PostgresUserSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => PostgresAccountSchema, (account) => account.profile, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'accountId' })
  account!: PostgresAccountSchema;

  @Column()
  accountId!: string;

  @Column()
  fullname!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatar?: string;

  @ManyToOne(() => PostgresRoleSchema, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'roleId' })
  role!: PostgresRoleSchema;

  @Column()
  roleId!: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
