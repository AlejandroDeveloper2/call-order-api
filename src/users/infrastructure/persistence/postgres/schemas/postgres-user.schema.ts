import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { PostgresRoleSchema } from './postgres-role.schema';

@Entity('users')
export class PostgresUserSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  fullname!: string;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  avatar?: string;

  @ManyToOne(() => PostgresRoleSchema, (role) => role.users, {
    onDelete: 'NO ACTION',
  })
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
