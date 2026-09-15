jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

import { EntityManager, Repository } from 'typeorm';

import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

import { SessionMapper } from '../mappers/session.mapper';

import { PostgresSessionRepository } from './postgres-session.repository';

describe('PostgresSessionRepository', () => {
  let repository: PostgresSessionRepository;
  let sessionRepository: jest.Mocked<Partial<Repository<never>>> & {
    manager: EntityManager;
  };
  let queryBuilder: Record<string, jest.Mock>;
  let manager: jest.Mocked<Partial<EntityManager>>;

  beforeEach(() => {
    queryBuilder = {
      innerJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      execute: jest.fn(),
      getOne: jest.fn(),
    };
    manager = { save: jest.fn(), update: jest.fn() };
    sessionRepository = {
      manager: manager as unknown as EntityManager,
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      update: jest.fn(),
    };
    repository = new PostgresSessionRepository(sessionRepository as never);
  });

  it('deberia mapear una sesion activa para validacion', async () => {
    // Arrange
    queryBuilder.getOne.mockResolvedValue({
      id: 'session-id',
      tokenHash: 'token-hash',
    });

    // Act
    const result = await repository.findActiveForValidation('account-id');

    // Assert
    expect(result).toEqual({
      sessionId: 'session-id',
      tokenHash: 'token-hash',
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'session.revokedAt IS NULL',
    );
  });

  it('deberia mapear una sesion activa para actualizar', async () => {
    // Arrange
    queryBuilder.getOne.mockResolvedValue({
      id: 'session-id',
      tokenHash: 'token-hash',
      refreshTokenHash: 'refresh-hash',
    });

    // Act
    const result = await repository.findActiveToUpdate('account-id');

    // Assert
    expect(result).toEqual({
      sessionId: 'session-id',
      tokenHash: 'token-hash',
      refreshTokenHash: 'refresh-hash',
    });
  });

  it('deberia devolver null cuando no existe una sesion activa', async () => {
    // Arrange
    queryBuilder.getOne.mockResolvedValue(null);

    // Act
    const result = await repository.findActiveForValidation('account-id');

    // Assert
    expect(result).toBeNull();
  });

  it('deberia crear una sesion con el manager transaccional', async () => {
    // Arrange
    const manager = { save: jest.fn() };
    const schema = { id: 'schema-id' };
    const toPersistence = jest
      .spyOn(SessionMapper, 'toPersistence')
      .mockReturnValue(schema as never);
    const context = new TypeOrmTransactionContext(
      manager as unknown as EntityManager,
    );

    // Act
    await repository.create({} as never, context);

    // Assert
    expect(toPersistence.mock.calls).toContainEqual([{}]);
    expect(manager.save.mock.calls).toContainEqual([schema]);
  });

  it('deberia revocar y refrescar una sesion', async () => {
    // Arrange
    (sessionRepository.update as jest.Mock)
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: undefined });
    const payload = {
      tokenHash: 'new-token',
      refreshTokenHash: 'new-refresh',
      lastActivityAt: new Date('2026-01-01'),
      expiresAt: new Date('2026-02-01'),
    };

    // Act
    const revoked = await repository.revoke('session-id');
    const refreshed = await repository.refresh('session-id', payload);

    // Assert
    expect(revoked).toBe(1);
    expect(refreshed).toBe(0);
    expect(sessionRepository.update).toHaveBeenNthCalledWith(
      2,
      { id: 'session-id' },
      payload,
    );
  });

  it('deberia revocar sesiones de una cuenta con o sin exclusion', async () => {
    // Arrange
    queryBuilder.execute.mockResolvedValue({ affected: 2 });

    // Act
    const affectedWithExclusion = await repository.revokeByAccountId(
      'account-id',
      new Date('2026-01-01'),
      'session-to-keep',
    );
    const affectedWithoutExclusion = await repository.revokeByAccountId(
      'account-id',
      new Date('2026-01-01'),
    );

    // Assert
    expect(affectedWithExclusion).toBe(2);
    expect(affectedWithoutExclusion).toBe(2);
    expect(queryBuilder.andWhere).toHaveBeenCalledWith('id != :excludeId', {
      excludeId: 'session-to-keep',
    });
  });

  it('deberia convertir errores de TypeORM a PersistenceException', async () => {
    // Arrange
    queryBuilder.getOne.mockRejectedValue(new Error('database error'));

    // Act
    const result = repository.findActiveToUpdate('account-id');

    // Assert
    await expect(result).rejects.toThrow(PersistenceException);
  });
});
