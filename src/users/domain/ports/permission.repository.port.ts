import { Permission } from '../entities';

export abstract class PermissionRepositoryPort {
  abstract findById(permissionId: string): Promise<Permission | null>;
  abstract findByCode(permissionCode: string): Promise<Permission | null>;
  abstract createMany(permissions: Permission[]): Promise<void>;
}
