import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PostgresRoleSchema } from '../../../users/infrastructure/persistence/postgres/schemas';

@Injectable()
export class RolesSeeder {
  constructor(
    @InjectRepository(PostgresRoleSchema)
    private readonly roleRepository: Repository<PostgresRoleSchema>,
  ) {}

  async getRoleById(roleId: string): Promise<PostgresRoleSchema | null> {
    const role = await this.roleRepository.findOneBy({ id: roleId });
    return role;
  }

  async getAllRoles(): Promise<PostgresRoleSchema[]> {
    const roles = await this.roleRepository.find({
      order: { name: 'ASC' },
    });
    return roles;
  }
}
