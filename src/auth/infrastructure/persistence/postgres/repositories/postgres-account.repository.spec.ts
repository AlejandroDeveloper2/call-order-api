jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

import { EntityManager, Repository } from 'typeorm';

import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

import { AccountMapper } from '../mappers/account.mapper';

import { PostgresAccountRepository } from './postgres-account.repository';

const createQueryBuilder = () => {
  const queryBuilder = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    innerJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    take: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
    getManyAndCount: jest.fn(),
  };

  return queryBuilder;
};

describe('PostgresAccountRepository', () => {
  let repository: PostgresAccountRepository;
  let accountRepository: jest.Mocked<Partial<Repository<never>>> & {
    manager: EntityManager;
  };
  let queryBuilder: ReturnType<typeof createQueryBuilder>;
  let manager: jest.Mocked<Partial<EntityManager>>;

  beforeEach(() => {
    queryBuilder = createQueryBuilder();
    manager = { save: jest.fn(), update: jest.fn() };
    accountRepository = {
      manager: manager as unknown as EntityManager,
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      existsBy: jest.fn(),
      update: jest.fn(),
    };
    repository = new PostgresAccountRepository(accountRepository as never);
  });

  it('deberia devolver cuentas paginadas y aplicar filtros', async () => {
    // Arrange
    queryBuilder.getManyAndCount.mockResolvedValue([
      [
        {
          id: 'account-id',
          email: 'john@example.com',
          profile: {
            fullname: 'John Doe',
            phone: '3000000000',
            roleId: 'role-id',
            isActive: true,
            role: { name: 'Admin' },
          },
        },
      ],
      3,
    ]);

    // Act
    const result = await repository.find({
      limit: 2,
      offset: 2,
      status: 'active',
      fullname: 'John',
      email: 'john@',
      phone: '300',
      roleId: 'role-id',
    });

    // Assert
    expect(result).toEqual({
      records: [
        {
          accountId: 'account-id',
          email: 'john@example.com',
          fullname: 'John Doe',
          phone: '3000000000',
          roleId: 'role-id',
          roleName: 'Admin',
          isActive: true,
        },
      ],
      page: 2,
      totalPages: 2,
      totalRecords: 3,
    });
    expect(queryBuilder.skip).toHaveBeenCalledWith(2);
    expect(queryBuilder.take).toHaveBeenCalledWith(2);
    expect(queryBuilder.andWhere).toHaveBeenCalledTimes(5);
  });

  it('deberia devolver una lista vacia con totalPages cero cuando el limite es cero', async () => {
    // Arrange
    queryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

    // Act
    const result = await repository.find({ limit: 0, offset: 0 });

    // Assert
    expect(result).toEqual({
      records: [],
      page: NaN,
      totalPages: 0,
      totalRecords: 0,
    });
  });

  it('deberia mapear los datos de login', async () => {
    // Arrange
    queryBuilder.getOne.mockResolvedValue({
      id: 'account-id',
      passwordHash: 'hash',
      failedAttempts: 2,
      lockedUntil: null,
      profile: { isActive: true },
    });

    // Act
    const result = await repository.findForLoginByEmail('john@example.com');

    // Assert
    expect(result).toEqual({
      accountId: 'account-id',
      passwordHash: 'hash',
      failedAttempts: 2,
      lockedUntil: null,
      profile: { isActive: true },
    });
    expect(queryBuilder.where).toHaveBeenCalledWith('account.email = :email', {
      email: 'john@example.com',
    });
  });

  it('deberia devolver null cuando no encuentra una cuenta', async () => {
    // Arrange
    queryBuilder.getOne.mockResolvedValue(null);

    // Act
    const result = await repository.findForTokenValidation('account-id');

    // Assert
    expect(result).toBeNull();
  });

  it('deberia comprobar si existe un correo', async () => {
    // Arrange
    (accountRepository.existsBy as jest.Mock).mockResolvedValue(true);

    // Act
    const result = await repository.verifyByEmail('john@example.com');

    // Assert
    expect(result).toBe(true);
    expect(accountRepository.existsBy).toHaveBeenCalledWith({
      email: 'john@example.com',
    });
  });

  it('deberia mapear identidad, token y actualizacion de password', async () => {
    // Arrange
    queryBuilder.getOne
      .mockResolvedValueOnce({
        id: 'account-id',
        profile: { id: 'profile-id', isActive: true, roleId: 'role-id' },
      })
      .mockResolvedValueOnce({
        id: 'account-id',
        lockedUntil: null,
        profile: { id: 'profile-id', isActive: true, roleId: 'role-id' },
      })
      .mockResolvedValueOnce({ id: 'account-id', passwordHash: 'hash' });

    // Act
    const identity = await repository.findForIdentityValidation('account-id');
    const token = await repository.findForTokenValidation('account-id');
    const password = await repository.findForUpdatingPassword('account-id');

    // Assert
    expect(identity?.profile.userId).toBe('profile-id');
    expect(token?.profile.profileId).toBe('profile-id');
    expect(password).toEqual({ accountId: 'account-id', passwordHash: 'hash' });
  });

  it('deberia guardar y actualizar usando el manager transaccional', async () => {
    // Arrange
    const transactionManager = { save: jest.fn(), update: jest.fn() };
    const context = new TypeOrmTransactionContext(
      transactionManager as unknown as EntityManager,
    );
    const schema = { id: 'schema-id' };
    jest.spyOn(AccountMapper, 'toPersistence').mockReturnValue(schema as never);
    transactionManager.update.mockResolvedValue({ affected: 1 });

    // Act
    await repository.create({} as never, context);
    const affected = await repository.updateLastLogin(
      'account-id',
      new Date('2026-01-01'),
      context,
    );

    // Assert
    expect(transactionManager.save).toHaveBeenCalledWith(schema);
    expect(transactionManager.update).toHaveBeenCalledWith(
      expect.anything(),
      { id: 'account-id' },
      { lastLoginAt: new Date('2026-01-01') },
    );
    expect(affected).toBe(1);
  });

  it('deberia ejecutar las actualizaciones de cuenta y normalizar affected', async () => {
    // Arrange
    (accountRepository.update as jest.Mock)
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: undefined })
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: 0 });

    // Act
    const blocked = await repository.block('account-id', 3);
    const unlocked = await repository.unlock('account-id');
    const password = await repository.updatePassword('account-id', 'new-hash');
    const email = await repository.updateEmail('account-id', 'new@example.com');

    // Assert
    expect(blocked).toBe(1);
    expect(unlocked).toBe(0);
    expect(password).toBe(1);
    expect(email).toBe(0);
    expect(accountRepository.update).toHaveBeenNthCalledWith(
      1,
      { id: 'account-id' },
      { lockedUntil: undefined, failedAttempts: 3 },
    );
  });

  it('deberia traducir errores del repositorio a PersistenceException', async () => {
    // Arrange
    (accountRepository.existsBy as jest.Mock).mockRejectedValue(
      new Error('database error'),
    );

    // Act
    const result = repository.verifyByEmail('john@example.com');

    // Assert
    await expect(result).rejects.toThrow(PersistenceException);
  });
});
