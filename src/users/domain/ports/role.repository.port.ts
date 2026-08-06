import { Role } from '../entities';

export abstract class RoleRepositoryPort {
  abstract findById(roleId: string): Promise<Role | null>;
  abstract findByName(roleName: string): Promise<Role | null>;
  abstract createMany(roles: Role[]): Promise<void>;
}
export const ROLE_REPOSITORY = 'ROLE_REPOSITORY';
