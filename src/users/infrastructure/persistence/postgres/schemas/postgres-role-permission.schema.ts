import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';

import { PostgresPermissionSchema } from './postgres-permission.schema';
import { PostgresRoleSchema } from './postgres-role.schema';

@Entity('role_permissions')
export class PostgresRolePermissionSchema {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => PostgresPermissionSchema, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'permissionId' })
  permission!: PostgresPermissionSchema;

  @Column()
  permissionId!: string;

  @ManyToOne(() => PostgresRoleSchema, { onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'roleId' })
  role!: PostgresRoleSchema;

  @Column()
  roleId!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
