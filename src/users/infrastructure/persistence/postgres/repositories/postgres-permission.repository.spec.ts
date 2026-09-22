import { Repository, SelectQueryBuilder } from 'typeorm';

/** Excepciones */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

/** Mappers */
import { PermissionMapper } from '../mappers/permission.mapper';

/** Repositorios */
import { PostgresPermissionRepository } from './postgres-permission.repository';

/** Esquemas */
import { PostgresPermissionSchema } from '../schemas';
import { Permission } from '../../../../domain/entities';

jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

type PermissionRepositoryMock = jest.Mocked<
  Pick<Repository<PostgresPermissionRepository>, 'createQueryBuilder'>
>;
type QueryBuilderMock = jest.Mocked<
  Pick<
    SelectQueryBuilder<PostgresPermissionSchema>,
    'innerJoin' | 'where' | 'getMany'
  >
>;

describe('PostgresPermissionRepository', () => {
  let repository: PostgresPermissionRepository;

  let permissionRepositoryMock: PermissionRepositoryMock;
  let queryBuilderMock: QueryBuilderMock;

  beforeEach(() => {
    queryBuilderMock = {
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
    };
    permissionRepositoryMock = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
    };

    repository = new PostgresPermissionRepository(
      permissionRepositoryMock as unknown as Repository<PostgresPermissionSchema>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findPermissionsByRoleId', () => {
    it('deberia devolver los permisos mapeados por rol', async () => {
      // Arrange
      const domainPermission = { permissionId: 'permission-id' } as Permission;
      const toDomain = jest
        .spyOn(PermissionMapper, 'toDomain')
        .mockReturnValue(domainPermission);
      queryBuilderMock.getMany.mockResolvedValue([
        { id: 'permission-id' },
      ] as PostgresPermissionSchema[]);

      // Act
      const result = await repository.findPermissionsByRoleId('role-id');

      // Assert
      expect(result).toEqual([domainPermission]);
      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'rp.roleId = :roleId',
        {
          roleId: 'role-id',
        },
      );
      expect(toDomain.mock.calls).toContainEqual([{ id: 'permission-id' }]);
    });

    it('deberia devolver una lista vacia cuando el rol no tiene permisos', async () => {
      // Arrange
      queryBuilderMock.getMany.mockResolvedValue([]);

      // Act
      const result = await repository.findPermissionsByRoleId('role-id');

      // Assert
      expect(result).toEqual([]);
    });

    it('deberia convertir errores de TypeORM a PersistenceException', async () => {
      // Arrange
      queryBuilderMock.getMany.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.findPermissionsByRoleId('role-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });
});
