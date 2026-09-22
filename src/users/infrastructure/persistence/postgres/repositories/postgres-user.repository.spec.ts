import { EntityManager, Repository } from 'typeorm';
import { UpdateResult } from 'typeorm/browser';

/** Entidades */
import { User } from '../../../../domain/entities';

/** Excepciones */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

/** Transacciones */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

/** Mappers */
import { UserMapper } from '../mappers/user.mapper';

/** Repositorios */
import { PostgresUserRepository } from './postgres-user.repository';

/** Esquemas */
import { PostgresUserSchema } from '../schemas';

jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

type UserRepositoryMock = jest.Mocked<
  Pick<Repository<PostgresUserSchema>, 'findOneBy' | 'update' | 'manager'>
>;
type EntityManagerMock = jest.Mocked<Pick<EntityManager, 'save'>>;

describe('PostgresUserRepository', () => {
  let repository: PostgresUserRepository;
  let userRepositoryMock: UserRepositoryMock;
  let managerMock: EntityManagerMock;

  beforeEach(() => {
    managerMock = { save: jest.fn() };

    userRepositoryMock = {
      manager: managerMock as unknown as EntityManager,
      findOneBy: jest.fn(),
      update: jest.fn(),
    };

    repository = new PostgresUserRepository(
      userRepositoryMock as unknown as Repository<PostgresUserSchema>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findById', () => {
    it('deberia mapear un usuario encontrado', async () => {
      // Arrange
      const domainUser = { getUserId: 'profile-id' } as User;
      jest.spyOn(UserMapper, 'toDomain').mockReturnValue(domainUser);
      userRepositoryMock.findOneBy.mockResolvedValue({
        id: 'profile-id',
      } as PostgresUserSchema);

      // Act
      const result = await repository.findById('profile-id');

      // Assert
      expect(result).toBe(domainUser);
      expect(userRepositoryMock.findOneBy).toHaveBeenCalledWith({
        id: 'profile-id',
      });
    });

    it('deberia devolver null cuando el usuario no existe', async () => {
      // Arrange
      userRepositoryMock.findOneBy.mockResolvedValue(null);

      // Act
      const result = await repository.findById('missing-id');

      // Assert
      expect(result).toBeNull();
    });

    it('deberia lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      userRepositoryMock.findOneBy.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.findById('profile-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('create', () => {
    it('deberia crear un usuario con el manager transaccional', async () => {
      // Arrange
      const schema = { id: 'schema-id' } as PostgresUserSchema;

      jest.spyOn(UserMapper, 'toPersistence').mockReturnValue(schema);

      const context = new TypeOrmTransactionContext(
        managerMock as unknown as EntityManager,
      );

      // Act
      await repository.create({} as User, context);

      // Assert
      expect(managerMock.save).toHaveBeenCalledWith(schema);
    });

    it('deberia lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      managerMock.save.mockRejectedValue(new Error('database error'));

      const schema = { id: 'schema-id' } as PostgresUserSchema;

      jest.spyOn(UserMapper, 'toPersistence').mockReturnValue(schema);

      const context = new TypeOrmTransactionContext(
        managerMock as unknown as EntityManager,
      );

      // Act
      const result = repository.create({} as User, context);

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('updateProfile', () => {
    it('deberia actualizar perfil y devolver affected', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.updateProfile('user-id', {
        fullname: 'John Doe',
      });

      // Assert
      expect(result).toBe(1);
      expect(userRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'user-id' },
        { fullname: 'John Doe' },
      );
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.updateProfile('user-id', {
        fullname: 'John Doe',
      });

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      userRepositoryMock.update.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.updateProfile('user-id', {
        fullname: 'John Doe',
      });

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('updateAvatar', () => {
    it('deberia actualizar el avatar de usuario y devolver affected', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.updateAvatar('user-id', 'avatar-url');

      // Assert
      expect(result).toBe(1);
      expect(userRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'user-id' },
        { avatar: 'avatar-url' },
      );
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.updateAvatar('user-id', 'avatar-url');

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      userRepositoryMock.update.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.updateAvatar('user-id', 'avatar-url');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('activate', () => {
    it('deberia activar el perfil de usuario y devolver affected', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.activate('user-id');

      // Assert
      expect(result).toBe(1);
      expect(userRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'user-id' },
        { isActive: true },
      );
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.activate('user-id');

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      userRepositoryMock.update.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.activate('user-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('deactivate', () => {
    it('deberia desactivar el perfil de usuario y devolver affected', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.deactivate('user-id');

      // Assert
      expect(result).toBe(1);
      expect(userRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'user-id' },
        { isActive: false },
      );
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      userRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.deactivate('user-id');

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      userRepositoryMock.update.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.deactivate('user-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });
});
