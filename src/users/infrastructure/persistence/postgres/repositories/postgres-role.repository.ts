import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

/** Puertos */
import { RoleRepositoryPort } from '../../../../domain/ports';
/** Entidad de dominio */
import { Role } from '../../../../domain/entities';

/** Esquema de base de datos*/
import { PostgresRoleSchema } from '../schemas';

@Injectable()
export class PostgresRoleRepository implements RoleRepositoryPort {
  constructor(
    @InjectRepository(PostgresRoleSchema)
    private readonly repository: Repository<PostgresRoleSchema>,
  ) {}
  async findById(roleId: string): Promise<Role | null> {
    const schema = await this.repository.findOneBy({ id: roleId });
    return schema ? new Role(schema.id, schema.name) : null;
  }
  async findByName(roleName: string): Promise<Role | null> {
    const schema = await this.repository.findOneBy({ name: roleName });
    return schema ? new Role(schema.id, schema.name) : null;
  }
  async createMany(roles: Role[]): Promise<void> {
    const schemas = roles.map((role) => {
      const schema = new PostgresRoleSchema();
      schema.id = role.roleId;
      schema.name = role.name;
      return schema;
    });
    await this.repository.save(schemas);
  }
}
