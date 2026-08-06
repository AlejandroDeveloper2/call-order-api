import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  OneToOne,
} from 'typeorm';

import { Permission, Role } from '../../../domain/entities';

@Entity('roles')
export class PostgresRolePermissionSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Permission, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'permissionId' })
  permission!: Permission;

  @Column()
  permissionId!: string;

  @OneToOne(() => Role, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'roleId' })
  @Column()
  roleId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
