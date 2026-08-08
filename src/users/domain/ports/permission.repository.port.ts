import { Permission } from '../entities';

export abstract class PermissionRepositoryPort {
  abstract findPermissionsByRoleId(roleId: string): Promise<Permission[]>;
}
export const PERMISSION_REPOSITORY = 'PERMISSION_REPOSITORY';
