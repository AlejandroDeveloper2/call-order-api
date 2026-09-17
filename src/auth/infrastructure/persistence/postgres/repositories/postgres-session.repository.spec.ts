import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { UpdateQueryBuilder } from 'typeorm/browser';

/** Excepciones */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

/** Transacciones */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

/** Mapper */
import { SessionMapper } from '../mappers/session.mapper';

/** Repositorios */
import { PostgresSessionRepository } from './postgres-session.repository';

/** Esquemas */
import { PostgresSessionSchema } from '../schemas';
import { UpdateResult } from 'typeorm/browser';

jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

type SessionRepositoryMock = Pick<
  Repository<PostgresSessionSchema>,
  'createQueryBuilder' | 'update' | 'manager'
>;

type CreateQueryBuilderMock = Pick<
  SelectQueryBuilder<PostgresSessionSchema>,
  | 'innerJoin'
  | 'select'
  | 'where'
  | 'andWhere'
  | 'update'
  | 'getOne'
  | 'execute'
>;
type UpdateQueryBuilderMock = Pick<
  UpdateQueryBuilder<PostgresSessionSchema>,
  'set' | 'where' | 'andWhere' | 'execute'
>;
type EntityManagerMock = Pick<EntityManager, 'save'>;

describe('PostgresSessionRepository', () => {
  let repository: PostgresSessionRepository;

  let sessionRepositoryMock: jest.Mocked<SessionRepositoryMock>;

  let queryBuilderMock: jest.Mocked<CreateQueryBuilderMock>;

  let entityManagerMock: jest.Mocked<EntityManagerMock>;

  let updateQueryBuilderMock: jest.Mocked<UpdateQueryBuilderMock>;

  beforeEach(() => {
    updateQueryBuilderMock = {
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    };
    queryBuilderMock = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnValue(updateQueryBuilderMock),
      execute: jest.fn(),
      getOne: jest.fn(),
    };
    entityManagerMock = { save: jest.fn() };
    sessionRepositoryMock = {
      manager: entityManagerMock as unknown as EntityManager,
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      update: jest.fn(),
    };
    repository = new PostgresSessionRepository(
      sessionRepositoryMock as unknown as Repository<PostgresSessionSchema>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findActiveForValidation', () => {
    it('deberia mapear una sesión activa para validación', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'session-id',
        tokenHash: 'token-hash',
      } as PostgresSessionSchema);

      // Act
      const result = await repository.findActiveForValidation('account-id');

      // Assert
      expect(result).toEqual({
        sessionId: 'session-id',
        tokenHash: 'token-hash',
      });

      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'account.id = :accountId',
        {
          accountId: 'account-id',
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'session.revokedAt IS NULL',
      );
    });

    it('debería devolver null cuando no encuentra la sesión', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findActiveForValidation('account-id');

      // Assert
      expect(result).toBeNull();
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      queryBuilderMock.getOne.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.findActiveForValidation('account-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('findActiveToUpdate', () => {
    it('deberia mapear una sesión activa para actualizar', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'session-id',
        tokenHash: 'token-hash',
        refreshTokenHash: 'refresh-token-hash',
      } as PostgresSessionSchema);

      // Act
      const result = await repository.findActiveToUpdate('account-id');

      // Assert
      expect(result).toEqual({
        sessionId: 'session-id',
        tokenHash: 'token-hash',
        refreshTokenHash: 'refresh-token-hash',
      });

      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'account.id = :accountId',
        {
          accountId: 'account-id',
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'session.revokedAt IS NULL',
      );
    });

    it('debería devolver null cuando no encuentra la sesión', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findActiveToUpdate('account-id');

      // Assert
      expect(result).toBeNull();
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      queryBuilderMock.getOne.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.findActiveToUpdate('account-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('create', () => {
    it('debería guardar la entidad usando el manager transaccional', async () => {
      // Arrange
      const transactionManager = {
        save: jest.fn(),
      };

      const context = new TypeOrmTransactionContext(
        transactionManager as unknown as EntityManager,
      );

      const schema = {
        id: 'schema-id',
      } as PostgresSessionSchema;

      const mapperSpy = jest
        .spyOn(SessionMapper, 'toPersistence')
        .mockReturnValue(schema);

      // Act
      await repository.create({} as never, context);

      // Assert
      expect(mapperSpy).toHaveBeenCalledTimes(1);

      expect(transactionManager.save).toHaveBeenCalledWith(schema);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      entityManagerMock.save.mockRejectedValue(new Error('database error'));

      const schema = {
        id: 'schema-id',
      } as PostgresSessionSchema;

      jest.spyOn(SessionMapper, 'toPersistence').mockReturnValue(schema);

      // Act
      const result = repository.create({} as never);

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('revoke', () => {
    it('deberia revocar una sesión y devolver affected', async () => {
      // Arrange
      sessionRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.revoke('session-id');

      // Assert
      expect(sessionRepositoryMock.update).toHaveBeenCalledWith(
        {
          id: 'session-id',
        },
        {
          revokedAt: expect.any(Date) as Date,
        },
      );

      expect(result).toBe(1);
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      sessionRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.revoke('session-id');

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      sessionRepositoryMock.update.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.revoke('session-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('refresh', () => {
    it('deberia refrescar una sesión y devolver affected', async () => {
      // Arrange
      const payload = {
        tokenHash: 'token-hash',
        refreshTokenHash: 'refresh-token-hash',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      };

      sessionRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.refresh('session-id', payload);

      // Assert
      expect(sessionRepositoryMock.update).toHaveBeenCalledWith(
        {
          id: 'session-id',
        },
        payload,
      );

      expect(result).toBe(1);
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      const payload = {
        tokenHash: 'token-hash',
        refreshTokenHash: 'refresh-token-hash',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      };

      sessionRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.refresh('session-id', payload);

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      const payload = {
        tokenHash: 'token-hash',
        refreshTokenHash: 'refresh-token-hash',
        lastActivityAt: new Date(),
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
      };

      sessionRepositoryMock.update.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.refresh('session-id', payload);

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('revokeByAccountId', () => {
    it('deberia revocar sesiones de una cuenta sin exclusion', async () => {
      // Arrange
      updateQueryBuilderMock.execute.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.revokeByAccountId(
        'account-id',
        new Date('2026-01-01'),
      );

      // Assert
      expect(result).toBe(1);

      expect(updateQueryBuilderMock.where).toHaveBeenCalledWith(
        'accountId = :accountId',
        {
          accountId: 'account-id',
        },
      );

      expect(updateQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'revokedAt IS NULL',
      );
    });

    it('deberia revocar sesiones de una cuenta con exclusion', async () => {
      // Arrange
      updateQueryBuilderMock.execute.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.revokeByAccountId(
        'account-id',
        new Date('2026-01-01'),
        'session-to-keep',
      );

      // Assert
      expect(result).toBe(1);

      expect(updateQueryBuilderMock.where).toHaveBeenCalledWith(
        'accountId = :accountId',
        {
          accountId: 'account-id',
        },
      );

      expect(updateQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'revokedAt IS NULL',
      );

      expect(updateQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'id != :excludeId',
        {
          excludeId: 'session-to-keep',
        },
      );
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      updateQueryBuilderMock.execute.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.revokeByAccountId(
        'account-id',
        new Date('2026-01-01'),
      );

      // Assert
      expect(result).toBe(0);
    });
    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      updateQueryBuilderMock.execute.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.revokeByAccountId(
        'account-id',
        new Date('2026-01-01'),
      );

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });
});
