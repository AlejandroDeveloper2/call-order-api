jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

import { EntityManager, Repository } from 'typeorm';

import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

import { VerificationCodeMapper } from '../mappers/verification-code.mapper';

import { PostgresVerificationCodeRepository } from './postgres-verification-code.repository';

describe('PostgresVerificationCodeRepository', () => {
  let repository: PostgresVerificationCodeRepository;
  let codeRepository: jest.Mocked<Partial<Repository<never>>> & {
    manager: EntityManager;
  };
  let queryBuilder: Record<string, jest.Mock>;

  beforeEach(() => {
    queryBuilder = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    const manager = { save: jest.fn(), update: jest.fn() };
    codeRepository = {
      manager: manager as unknown as EntityManager,
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      save: jest.fn(),
      update: jest.fn(),
    };
    repository = new PostgresVerificationCodeRepository(
      codeRepository as never,
    );
  });

  it('deberia mapear un codigo para validar identidad', async () => {
    // Arrange
    const expiresAt = new Date('2026-01-01');
    queryBuilder.getOne.mockResolvedValue({
      id: 'code-id',
      codeHash: 'hash',
      expiresAt,
      attempts: 1,
      accountId: 'account-id',
      account: { profile: { id: 'profile-id', roleId: 'role-id' } },
    });

    // Act
    const result = await repository.findForIdentityValidation(
      'john@example.com',
      'lookup',
    );

    // Assert
    expect(result).toEqual({
      verificationCodeId: 'code-id',
      codeHash: 'hash',
      expiresAt,
      attempts: 1,
      accountId: 'account-id',
      profile: { profileId: 'profile-id', roleId: 'role-id' },
    });
    expect(queryBuilder.orderBy).toHaveBeenCalledWith('code.createdAt', 'DESC');
  });

  it('deberia buscar codigos expirados y devolver null cuando no existe resultado', async () => {
    // Arrange
    queryBuilder.getOne.mockResolvedValue(null);

    // Act
    const result = await repository.findExpiredForForwarding(
      'john@example.com',
      'lookup',
    );

    // Assert
    expect(result).toBeNull();
    const [, parameters] = queryBuilder.andWhere.mock.calls.find(
      ([condition]) => condition === 'code.expiresAt < :now',
    ) as [string, { now: unknown }];
    expect(parameters.now).toBeInstanceOf(Date);
  });

  it('deberia crear y marcar como usado un codigo con manager transaccional', async () => {
    // Arrange
    const schema = { id: 'schema-id' };
    const manager = { update: jest.fn().mockResolvedValue({ affected: 1 }) };
    jest
      .spyOn(VerificationCodeMapper, 'toPersistence')
      .mockReturnValue(schema as never);
    const context = new TypeOrmTransactionContext(
      manager as unknown as EntityManager,
    );

    // Act
    await repository.create({} as never);
    const affected = await repository.markAsUsed(
      'code-id',
      new Date('2026-01-01'),
      context,
    );

    // Assert
    expect(codeRepository.save).toHaveBeenCalledWith(schema);
    expect(manager.update).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'code-id' },
      { usedAt: new Date('2026-01-01') },
    );
    expect(affected).toBe(1);
  });

  it('deberia refrescar el codigo y normalizar affected', async () => {
    // Arrange
    (codeRepository.update as jest.Mock).mockResolvedValue({
      affected: undefined,
    });
    const payload = {
      attempts: 2,
      codeHash: 'new-hash',
      codeLookup: 'new-lookup',
      expiresAt: new Date('2026-01-02'),
    };

    // Act
    const result = await repository.refresh('code-id', payload);

    // Assert
    expect(result).toBe(0);
    expect(codeRepository.update).toHaveBeenCalledWith(
      { id: 'code-id' },
      payload,
    );
  });

  it('deberia convertir errores de TypeORM a PersistenceException', async () => {
    // Arrange
    (codeRepository.save as jest.Mock).mockRejectedValue(
      new Error('database error'),
    );

    // Act
    const result = repository.create({} as never);

    // Assert
    await expect(result).rejects.toThrow(PersistenceException);
  });
});
