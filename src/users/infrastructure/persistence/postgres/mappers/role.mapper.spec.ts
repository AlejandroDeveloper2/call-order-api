import { Role } from '../../../../domain/entities';

import { PostgresRoleSchema } from '../schemas/postgres-role.schema';

import { RoleMapper } from './role.mapper';

describe('RoleMapper', () => {
  it('deberia convertir un schema de rol al dominio', () => {
    // Arrange
    const schema = Object.assign(new PostgresRoleSchema(), {
      id: 'role-id',
      name: 'Administrator',
    });

    // Act
    const result = RoleMapper.toDomain(schema);

    // Assert
    expect(result).toBeInstanceOf(Role);
    expect(result).toEqual(new Role('role-id', 'Administrator'));
  });

  it('deberia convertir un rol de dominio al schema de persistencia', () => {
    // Arrange
    const role = new Role('role-id', 'Administrator');

    // Act
    const result = RoleMapper.toPersistence(role);

    // Assert
    expect(result).toBeInstanceOf(PostgresRoleSchema);
    expect(result).toMatchObject({
      id: 'role-id',
      name: 'Administrator',
    });
  });
});
