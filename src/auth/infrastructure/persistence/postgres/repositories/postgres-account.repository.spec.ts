import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { UpdateResult } from 'typeorm/browser';

/* Excepciones */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

/** Contexto de transacción */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

/** Mapper */
import { AccountMapper } from '../mappers/account.mapper';

/** Repositorio */
import { PostgresAccountRepository } from './postgres-account.repository';

/** Esquemas */
import { PostgresAccountSchema } from '../schemas';

type AccountRepositoryMock = Pick<
  Repository<PostgresAccountSchema>,
  'createQueryBuilder' | 'existsBy' | 'update' | 'manager'
>;
type CreateQueryBuilderMock = Pick<
  SelectQueryBuilder<PostgresAccountSchema>,
  | 'leftJoinAndSelect'
  | 'innerJoinAndSelect'
  | 'select'
  | 'where'
  | 'andWhere'
  | 'skip'
  | 'take'
  | 'getOne'
  | 'getManyAndCount'
>;
type EntityManagerMock = Pick<EntityManager, 'save' | 'update'>;

jest.mock('uuid', () => ({
  v7: jest.fn(() => 'test-uuid'),
}));

describe('PostgresAccountRepository', () => {
  let repository: PostgresAccountRepository;

  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;

  let queryBuilderMock: jest.Mocked<CreateQueryBuilderMock>;

  let entityManagerMock: jest.Mocked<EntityManagerMock>;

  beforeEach(() => {
    queryBuilderMock = {
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

    entityManagerMock = {
      save: jest.fn(),
      update: jest.fn(),
    };

    accountRepositoryMock = {
      manager: entityManagerMock as unknown as EntityManager,
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilderMock),
      existsBy: jest.fn(),
      update: jest.fn(),
    };

    repository = new PostgresAccountRepository(
      accountRepositoryMock as unknown as Repository<PostgresAccountSchema>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('find', () => {
    it('debería devolver cuentas paginadas y aplicar todos los filtros', async () => {
      // Arrange
      queryBuilderMock.getManyAndCount.mockResolvedValue([
        [
          {
            id: 'account-id',
            email: 'john@example.com',
            passwordHash: '',
            mustChangePassword: false,
            failedAttempts: 0,
            profileId: '',
            verificationCodes: [],
            sessions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
            profile: {
              id: 'profile-id',
              fullname: 'John Doe',
              phone: '3000000000',
              roleId: 'role-id',
              isActive: true,
              role: {
                id: 'role-id',
                name: 'Administrador',
                users: [],
                createdAt: new Date(),
                updatedAt: new Date(),
              },
              createdAt: new Date(),
              updatedAt: new Date(),
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
            roleName: 'Administrador',
            isActive: true,
          },
        ],
        page: 2,
        totalPages: 2,
        totalRecords: 3,
      });

      // expect(queryBuilderMock.createQueryBuilder).toBeUndefined();

      expect(accountRepositoryMock.createQueryBuilder).toHaveBeenCalledWith(
        'account',
      );

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'account.profile',
        'profile',
      );

      expect(queryBuilderMock.leftJoinAndSelect).toHaveBeenCalledWith(
        'profile.role',
        'role',
      );

      expect(queryBuilderMock.andWhere).toHaveBeenNthCalledWith(
        1,
        'profile.isActive = :status',
        {
          status: true,
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenNthCalledWith(
        2,
        'profile.fullname ILIKE :fullname',
        {
          fullname: '%John%',
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenNthCalledWith(
        3,
        'account.email ILIKE :email',
        {
          email: '%john@%',
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenNthCalledWith(
        4,
        'profile.phone ILIKE :phone',
        {
          phone: '%300%',
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenNthCalledWith(
        5,
        'profile.roleId = :roleId',
        {
          roleId: 'role-id',
        },
      );

      expect(queryBuilderMock.andWhere).toHaveBeenCalledTimes(5);

      expect(queryBuilderMock.skip).toHaveBeenCalledWith(2);

      expect(queryBuilderMock.take).toHaveBeenCalledWith(2);

      expect(queryBuilderMock.getManyAndCount).toHaveBeenCalledTimes(1);
    });

    it('debería devolver registros sin aplicar filtros opcionales', async () => {
      // Arrange
      queryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      const result = await repository.find({
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(result).toEqual({
        records: [],
        page: 1,
        totalPages: 0,
        totalRecords: 0,
      });

      expect(queryBuilderMock.andWhere).not.toHaveBeenCalled();

      expect(queryBuilderMock.skip).toHaveBeenCalledWith(0);

      expect(queryBuilderMock.take).toHaveBeenCalledWith(10);
    });

    it('debería filtrar cuentas inactivas cuando status es inactive', async () => {
      // Arrange
      queryBuilderMock.getManyAndCount.mockResolvedValue([[], 0]);

      // Act
      await repository.find({
        status: 'inactive',
      });

      // Assert
      expect(queryBuilderMock.andWhere).toHaveBeenCalledWith(
        'profile.isActive = :status',
        {
          status: false,
        },
      );
    });

    it('debería lanzar PersistenceException si ocurre un error durante la consulta', async () => {
      // Arrange
      queryBuilderMock.getManyAndCount.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.find({
        limit: 10,
        offset: 0,
      });

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('findForLoginByEmail', () => {
    it('debería mapear los datos de login cuando la cuenta existe', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'account-id',
        passwordHash: 'hash',
        failedAttempts: 2,
        lockedUntil: undefined,
        profile: {
          isActive: true,
        },
      } as PostgresAccountSchema);

      // Act
      const result = await repository.findForLoginByEmail('john@example.com');

      // Assert
      expect(result).toEqual({
        accountId: 'account-id',
        passwordHash: 'hash',
        failedAttempts: 2,
        lockedUntil: undefined,
        profile: {
          isActive: true,
        },
      });

      expect(accountRepositoryMock.createQueryBuilder).toHaveBeenCalledWith(
        'account',
      );

      expect(queryBuilderMock.innerJoinAndSelect).toHaveBeenCalledWith(
        'account.profile',
        'profile',
      );

      expect(queryBuilderMock.select).toHaveBeenCalledWith([
        'account.id',
        'account.passwordHash',
        'account.failedAttempts',
        'account.lockedUntil',
        'profile.id',
        'profile.isActive',
      ]);

      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'account.email = :email',
        {
          email: 'john@example.com',
        },
      );
    });

    it('debería devolver null cuando no encuentra la cuenta', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findForLoginByEmail('john@example.com');

      // Assert
      expect(result).toBeNull();
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      queryBuilderMock.getOne.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.findForLoginByEmail('john@example.com');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('verifyByEmail', () => {
    it('debería devolver true cuando el correo existe', async () => {
      // Arrange
      accountRepositoryMock.existsBy.mockResolvedValue(true);

      // Act
      const result = await repository.verifyByEmail('john@example.com');

      // Assert
      expect(result).toBe(true);

      expect(accountRepositoryMock.existsBy).toHaveBeenCalledWith({
        email: 'john@example.com',
      });
    });

    it('debería devolver false cuando el correo no existe', async () => {
      // Arrange
      accountRepositoryMock.existsBy.mockResolvedValue(false);

      // Act
      const result = await repository.verifyByEmail('john@example.com');

      // Assert
      expect(result).toBe(false);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      accountRepositoryMock.existsBy.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.verifyByEmail('john@example.com');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('findForIdentityValidation', () => {
    it('debería mapear correctamente los datos de identidad', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'account-id',
        profile: {
          id: 'profile-id',
          isActive: true,
          roleId: 'role-id',
        },
      } as PostgresAccountSchema);

      // Act
      const result = await repository.findForIdentityValidation('account-id');

      // Assert
      expect(result).toEqual({
        accountId: 'account-id',
        profile: {
          isActive: true,
          userId: 'profile-id',
          roleId: 'role-id',
        },
      });

      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'account.id = :accountId',
        {
          accountId: 'account-id',
        },
      );
    });

    it('debería devolver null cuando la cuenta no existe', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findForIdentityValidation('account-id');

      // Assert
      expect(result).toBeNull();
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      queryBuilderMock.getOne.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.findForIdentityValidation('account-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('findForTokenValidation', () => {
    it('debería mapear correctamente los datos del token', async () => {
      // Arrange
      const lockedUntil = new Date('2026-01-01');

      queryBuilderMock.getOne.mockResolvedValue({
        id: 'account-id',
        lockedUntil,
        profile: {
          id: 'profile-id',
          isActive: true,
          roleId: 'role-id',
        },
      } as PostgresAccountSchema);

      // Act
      const result = await repository.findForTokenValidation('account-id');

      // Assert
      expect(result).toEqual({
        accountId: 'account-id',
        lockedUntil,
        profile: {
          isActive: true,
          profileId: 'profile-id',
          roleId: 'role-id',
        },
      });
    });

    it('debería devolver null cuando la cuenta no existe', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findForTokenValidation('account-id');

      // Assert
      expect(result).toBeNull();
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      queryBuilderMock.getOne.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.findForTokenValidation('account-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('findForUpdatingPassword', () => {
    it('debería devolver la información necesaria para actualizar la contraseña', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue({
        id: 'account-id',
        passwordHash: 'stored-password-hash',
      } as PostgresAccountSchema);

      // Act
      const result = await repository.findForUpdatingPassword('account-id');

      // Assert
      expect(result).toEqual({
        accountId: 'account-id',
        passwordHash: 'stored-password-hash',
      });

      expect(queryBuilderMock.select).toHaveBeenCalledWith([
        'account.id',
        'account.passwordHash',
      ]);

      expect(queryBuilderMock.where).toHaveBeenCalledWith(
        'account.id = :accountId',
        {
          accountId: 'account-id',
        },
      );
    });

    it('debería devolver null cuando la cuenta no existe', async () => {
      // Arrange
      queryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findForUpdatingPassword('account-id');

      // Assert
      expect(result).toBeNull();
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      queryBuilderMock.getOne.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.findForUpdatingPassword('account-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('create', () => {
    it('debería guardar la entidad usando el manager transaccional', async () => {
      // Arrange
      const transactionManager = {
        save: jest.fn(),
        update: jest.fn(),
      };

      const context = new TypeOrmTransactionContext(
        transactionManager as unknown as EntityManager,
      );

      const schema = {
        id: 'schema-id',
      } as PostgresAccountSchema;

      const mapperSpy = jest
        .spyOn(AccountMapper, 'toPersistence')
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
      } as PostgresAccountSchema;

      jest.spyOn(AccountMapper, 'toPersistence').mockReturnValue(schema);

      // Act
      const result = repository.create({} as never);

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('updateLastLogin', () => {
    it('debería actualizar lastLoginAt usando el manager transaccional', async () => {
      // Arrange
      const transactionManager = {
        save: jest.fn(),
        update: jest.fn().mockResolvedValue({
          affected: 1,
        }),
      };

      const context = new TypeOrmTransactionContext(
        transactionManager as unknown as EntityManager,
      );

      const lastLoginAt = new Date('2026-01-01');

      // Act
      const result = await repository.updateLastLogin(
        'account-id',
        lastLoginAt,
        context,
      );

      // Assert
      expect(transactionManager.update).toHaveBeenCalledWith(
        PostgresAccountSchema,
        {
          id: 'account-id',
        },
        {
          lastLoginAt,
        },
      );

      expect(result).toBe(1);
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      const transactionManager = {
        save: jest.fn(),
        update: jest.fn().mockResolvedValue({
          affected: undefined,
        }),
      };

      const context = new TypeOrmTransactionContext(
        transactionManager as unknown as EntityManager,
      );

      // Act
      const result = await repository.updateLastLogin(
        'account-id',
        new Date('2026-01-01'),
        context,
      );

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      entityManagerMock.update.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.updateLastLogin(
        'account-id',
        new Date('2026-01-01'),
      );

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('block', () => {
    it('debería bloquear la cuenta y devolver affected', async () => {
      // Arrange
      const lockedUntil = new Date('2026-01-01');

      accountRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.block('account-id', 3, lockedUntil);

      // Assert
      expect(accountRepositoryMock.update).toHaveBeenCalledWith(
        {
          id: 'account-id',
        },
        {
          lockedUntil,
          failedAttempts: 3,
        },
      );

      expect(result).toBe(1);
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      accountRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.block('account-id', 3);

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      accountRepositoryMock.update.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.block('account-id', 3);

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('unlock', () => {
    it('debería desbloquear la cuenta y resetear los intentos', async () => {
      // Arrange
      accountRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.unlock('account-id');

      // Assert
      expect(accountRepositoryMock.update).toHaveBeenCalledWith(
        {
          id: 'account-id',
        },
        {
          lockedUntil: undefined,
          failedAttempts: 0,
        },
      );

      expect(result).toBe(1);
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      accountRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.unlock('account-id');

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      accountRepositoryMock.update.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.unlock('account-id');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('updatePassword', () => {
    it('debería actualizar la contraseña y devolver affected', async () => {
      // Arrange
      accountRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.updatePassword('account-id', 'new-hash');

      // Assert
      expect(accountRepositoryMock.update).toHaveBeenCalledWith(
        {
          id: 'account-id',
        },
        {
          passwordHash: 'new-hash',
        },
      );

      expect(result).toBe(1);
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      accountRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.updatePassword('account-id', 'new-hash');

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      accountRepositoryMock.update.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.updatePassword('account-id', 'new-hash');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('updateEmail', () => {
    it('debería actualizar el email y devolver affected', async () => {
      // Arrange
      accountRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      // Act
      const result = await repository.updateEmail(
        'account-id',
        'new@example.com',
      );

      // Assert
      expect(accountRepositoryMock.update).toHaveBeenCalledWith(
        {
          id: 'account-id',
        },
        {
          email: 'new@example.com',
        },
      );

      expect(result).toBe(1);
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      accountRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      // Act
      const result = await repository.updateEmail(
        'account-id',
        'new@example.com',
      );

      // Assert
      expect(result).toBe(0);
    });

    it('debería lanzar PersistenceException cuando ocurre un error', async () => {
      // Arrange
      accountRepositoryMock.update.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.updateEmail('account-id', 'new@example.com');

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });
});
