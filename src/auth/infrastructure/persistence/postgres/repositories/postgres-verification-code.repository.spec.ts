import { EntityManager, Repository, SelectQueryBuilder } from 'typeorm';
import { UpdateResult } from 'typeorm/browser';

/** Entidades */
import { VerificationCode } from '../../../../domain/entities';

/** Excepciones */
import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

/** Transacciónes */
import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

/** Mapper */
import { VerificationCodeMapper } from '../mappers/verification-code.mapper';

/** Repositorios */
import { PostgresVerificationCodeRepository } from './postgres-verification-code.repository';

/** Esquema */
import { PostgresVerificationCodeSchema } from '../schemas';

jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

type CodeRepositoryMock = Pick<
  Repository<PostgresVerificationCodeSchema>,
  'createQueryBuilder' | 'manager' | 'update' | 'save'
>;
type CreateQueryBuilderMock = Pick<
  SelectQueryBuilder<PostgresVerificationCodeSchema>,
  'innerJoinAndSelect' | 'select' | 'where' | 'andWhere' | 'getOne' | 'orderBy'
>;
type EntityManagerMock = Pick<EntityManager, 'save' | 'update'>;

describe('PostgresVerificationCodeRepository', () => {
  let repository: PostgresVerificationCodeRepository;

  let codeRepositoryMock: jest.Mocked<CodeRepositoryMock>;

  let createQueryBuilderMock: jest.Mocked<CreateQueryBuilderMock>;

  let entityManagerMock: jest.Mocked<EntityManagerMock>;

  beforeEach(() => {
    createQueryBuilderMock = {
      innerJoinAndSelect: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getOne: jest.fn(),
    };
    entityManagerMock = { save: jest.fn(), update: jest.fn() };
    codeRepositoryMock = {
      manager: entityManagerMock as unknown as EntityManager,
      createQueryBuilder: jest.fn().mockReturnValue(createQueryBuilderMock),
      update: jest.fn(),
      save: jest.fn(),
    };

    repository = new PostgresVerificationCodeRepository(
      codeRepositoryMock as unknown as Repository<PostgresVerificationCodeSchema>,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('findForIdentityValidation', () => {
    it('deberia mapear un codigo para validar identidad', async () => {
      // Arrange
      const expiresAt = new Date('2026-01-01');
      createQueryBuilderMock.getOne.mockResolvedValue({
        id: 'code-id',
        codeHash: 'hash',
        expiresAt,
        attempts: 0,
        accountId: 'account-id',
        account: { profile: { id: 'profile-id', roleId: 'role-id' } },
      } as PostgresVerificationCodeSchema);

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
        attempts: 0,
        accountId: 'account-id',
        profile: { profileId: 'profile-id', roleId: 'role-id' },
      });

      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'account.email = :email',
        { email: 'john@example.com' },
      );

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'code.codeLookup = :codeLookup',
        {
          codeLookup: 'lookup',
        },
      );

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'code.usedAt IS NULL',
      );

      expect(createQueryBuilderMock.orderBy).toHaveBeenCalledWith(
        'code.createdAt',
        'DESC',
      );
    });

    it('deberia devolver null cuando no existe el código', async () => {
      // Arrange
      createQueryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findForIdentityValidation(
        'john@example.com',
        'lookup',
      );

      // Assert
      expect(result).toBeNull();
    });

    it('deberia lanzar PersistenceException si ocurre un error durante la consulta', async () => {
      // Arrange
      createQueryBuilderMock.getOne.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.findForIdentityValidation(
        'john@example.com',
        'lookup',
      );

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('findExpiredForForwarding', () => {
    it('deberia mapear un código expirado para reenvio', async () => {
      // Arrange
      const expiresAt = new Date('2026-01-01');

      createQueryBuilderMock.getOne.mockResolvedValue({
        id: 'code-id',
        codeHash: 'hash',
        expiresAt,
        attempts: 1,
        accountId: 'account-id',
        account: { profile: { id: 'profile-id', roleId: 'role-id' } },
      } as PostgresVerificationCodeSchema);

      // Act
      const result = await repository.findExpiredForForwarding(
        'john@example.com',
        'lookup',
      );

      // Assert
      const [, parameters] = createQueryBuilderMock.andWhere.mock.calls.find(
        ([condition]) => condition === 'code.expiresAt < :now',
      ) as [string, { now: unknown }];

      expect(result).toEqual({
        verificationCodeId: 'code-id',
        codeHash: 'hash',
        expiresAt,
        attempts: 1,
        accountId: 'account-id',
        profile: { profileId: 'profile-id', roleId: 'role-id' },
      });

      expect(createQueryBuilderMock.where).toHaveBeenCalledWith(
        'account.email = :email',
        { email: 'john@example.com' },
      );

      expect(createQueryBuilderMock.andWhere).toHaveBeenCalledWith(
        'code.codeLookup = :codeLookup',
        {
          codeLookup: 'lookup',
        },
      );

      expect(parameters.now).toBeInstanceOf(Date);

      expect(createQueryBuilderMock.orderBy).toHaveBeenCalledWith(
        'code.createdAt',
        'DESC',
      );
    });

    it('deberia buscar codigos expirados y devolver null cuando no existe resultado', async () => {
      // Arrange
      createQueryBuilderMock.getOne.mockResolvedValue(null);

      // Act
      const result = await repository.findExpiredForForwarding(
        'john@example.com',
        'lookup',
      );

      // Assert
      const [, parameters] = createQueryBuilderMock.andWhere.mock.calls.find(
        ([condition]) => condition === 'code.expiresAt < :now',
      ) as [string, { now: unknown }];

      expect(result).toBeNull();
      expect(parameters.now).toBeInstanceOf(Date);
    });

    it('deberia lanzar PersistenceException si ocurre un error durante la consulta', async () => {
      // Arrange
      createQueryBuilderMock.getOne.mockRejectedValue(
        new Error('database error'),
      );

      // Act
      const result = repository.findExpiredForForwarding(
        'john@example.com',
        'lookup',
      );

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('create', () => {
    it('deberia crear un código de verificación', async () => {
      // Arrange
      const verificationCode = VerificationCode.create(
        'code-id',
        'code-hash',
        'lookup',
        'double-factor',
        new Date(Date.now() + 10 * 60 * 1000),
        0,
        'account-id',
      );

      codeRepositoryMock.save.mockResolvedValue({
        id: 'code-id',
        accountId: 'account-id',
        codeHash: 'code-hash',
        codeLookup: 'lookup',
      } as PostgresVerificationCodeSchema);

      const schema = {
        id: 'schema-id',
      } as PostgresVerificationCodeSchema;

      const mapperSpy = jest
        .spyOn(VerificationCodeMapper, 'toPersistence')
        .mockReturnValue(schema);

      // Act
      await repository.create(verificationCode);

      // Assert
      expect(mapperSpy).toHaveBeenCalledTimes(1);
      expect(codeRepositoryMock.save).toHaveBeenCalledWith(schema);
    });

    it('deberia lanzar PersistenceException si ocurre un error durante la creación', async () => {
      // Arrange
      const verificationCode = VerificationCode.create(
        'code-id',
        'code-hash',
        'lookup',
        'double-factor',
        new Date(Date.now() + 10 * 60 * 1000),
        0,
        'account-id',
      );

      codeRepositoryMock.save.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.create(verificationCode);

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('markAsUsed', () => {
    it('deberia marcar como usado un codigo con manager transaccional', async () => {
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

      // Act
      const affected = await repository.markAsUsed(
        'code-id',
        new Date('2026-01-01'),
        context,
      );

      // Assert
      expect(transactionManager.update).toHaveBeenCalledWith(
        PostgresVerificationCodeSchema,
        { id: 'code-id' },
        { usedAt: new Date('2026-01-01') },
      );
      expect(affected).toBe(1);
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
      const affected = await repository.markAsUsed(
        'code-id',
        new Date('2026-01-01'),
        context,
      );

      // Assert
      expect(affected).toBe(0);
    });

    it('deberia lanzar PersistenceException si ocurre un error durante la actualización', async () => {
      // Arrange
      entityManagerMock.update.mockRejectedValue(new Error('database error'));

      // Act
      const result = repository.markAsUsed('code-id', new Date('2026-01-01'));

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });

  describe('refresh', () => {
    it('deberia refrescar el codigo y normalizar affected', async () => {
      // Arrange
      codeRepositoryMock.update.mockResolvedValue({
        affected: 1,
      } as UpdateResult);

      const payload = {
        attempts: 2,
        codeHash: 'new-hash',
        codeLookup: 'new-lookup',
        expiresAt: new Date('2026-01-02'),
      };

      // Act
      const result = await repository.refresh('code-id', payload);

      // Assert
      expect(result).toBe(1);
      expect(codeRepositoryMock.update).toHaveBeenCalledWith(
        { id: 'code-id' },
        payload,
      );
    });

    it('debería devolver cero cuando affected es undefined', async () => {
      // Arrange
      codeRepositoryMock.update.mockResolvedValue({
        affected: undefined,
      } as UpdateResult);

      const payload = {
        attempts: 2,
        codeHash: 'new-hash',
        codeLookup: 'new-lookup',
        expiresAt: new Date('2026-01-02'),
      };

      // Act
      const affected = await repository.refresh('code-id', payload);

      // Assert
      expect(affected).toBe(0);
    });

    it('deberia lanzar PersistenceException si ocurre un error durante la actualización', async () => {
      // Arrange
      codeRepositoryMock.update.mockRejectedValue(new Error('database error'));

      const payload = {
        attempts: 2,
        codeHash: 'new-hash',
        codeLookup: 'new-lookup',
        expiresAt: new Date('2026-01-02'),
      };

      // Act
      const result = repository.refresh('code-id', payload);

      // Assert
      await expect(result).rejects.toThrow(PersistenceException);
    });
  });
});
