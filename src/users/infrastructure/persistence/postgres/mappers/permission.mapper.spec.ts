import { Permission } from '../../../../domain/entities';

import { PostgresPermissionSchema } from '../schemas/postgres-permission.schema';

import { PermissionMapper } from './permission.mapper';

describe('PermissionMapper', () => {
  it('deberia convertir un schema de permiso al dominio', () => {
    // Arrange
    const schema = Object.assign(new PostgresPermissionSchema(), {
      id: 'permission-id',
      code: 'auth:read',
      description: 'Read permission',
    });

    // Act
    const result = PermissionMapper.toDomain(schema);

    // Assert
    expect(result).toBeInstanceOf(Permission);
    expect(result).toEqual(
      new Permission('permission-id', 'auth:read', 'Read permission'),
    );
  });

  it('deberia convertir un permiso de dominio al schema de persistencia', () => {
    // Arrange
    const permission = new Permission(
      'permission-id',
      'auth:read',
      'Read permission',
    );

    // Act
    const result = PermissionMapper.toPersistence(permission);

    // Assert
    expect(result).toBeInstanceOf(PostgresPermissionSchema);
    expect(result).toMatchObject({
      id: 'permission-id',
      code: 'auth:read',
      description: 'Read permission',
    });
  });
});
