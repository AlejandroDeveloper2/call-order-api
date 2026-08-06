import { RolePermission } from '../entities';

export abstract class RolePermissionRepositoryPort {
  abstract findById(rolePermissionId: string): Promise<RolePermission | null>;
  abstract findByRoleId(roleId: string): Promise<RolePermission[]>;
  abstract createMany(rolePermissions: RolePermission[]): Promise<void>;
}
export const ROLE_PERMISSION_REPOSITORY = 'ROLE_PERMISSION_REPOSITORY';
