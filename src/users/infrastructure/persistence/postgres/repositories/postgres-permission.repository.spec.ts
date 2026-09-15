jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

import { Repository } from 'typeorm';

import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

import { PermissionMapper } from '../mappers/permission.mapper';

import { PostgresPermissionRepository } from './postgres-permission.repository';

describe('PostgresPermissionRepository', () => {
  let repository: PostgresPermissionRepository;
  let permissionRepository: jest.Mocked<Partial<Repository<never>>>;
  let rolePermissionRepository: jest.Mocked<Partial<Repository<never>>>;
  let queryBuilder: Record<string, jest.Mock>;

  beforeEach(() => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    permissionRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    rolePermissionRepository = {};
    repository = new PostgresPermissionRepository(
      permissionRepository as never,
      rolePermissionRepository as never,
    );
  });

  it('deberia devolver los permisos mapeados por rol', async () => {
    // Arrange
    const domainPermission = { permissionId: 'permission-id' };
    const toDomain = jest
      .spyOn(PermissionMapper, 'toDomain')
      .mockReturnValue(domainPermission as never);
    queryBuilder.getMany.mockResolvedValue([{ id: 'permission-id' }]);

    // Act
    const result = await repository.findPermissionsByRoleId('role-id');

    // Assert
    expect(result).toEqual([domainPermission]);
    expect(queryBuilder.where).toHaveBeenCalledWith('rp.roleId = :roleId', {
      roleId: 'role-id',
    });
    expect(toDomain.mock.calls).toContainEqual([{ id: 'permission-id' }]);
  });

  it('deberia devolver una lista vacia cuando el rol no tiene permisos', async () => {
    // Arrange
    queryBuilder.getMany.mockResolvedValue([]);

    // Act
    const result = await repository.findPermissionsByRoleId('role-id');

    // Assert
    expect(result).toEqual([]);
  });

  it('deberia convertir errores de TypeORM a PersistenceException', async () => {
    // Arrange
    queryBuilder.getMany.mockRejectedValue(new Error('database error'));

    // Act
    const result = repository.findPermissionsByRoleId('role-id');

    // Assert
    await expect(result).rejects.toThrow(PersistenceException);
  });
});
