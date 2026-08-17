import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/** Entidades */
import { Account } from '../../../domain/entities';
import { User } from '../../../../users/domain/entities';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';

import {
  USER_REPOSITORY,
  UserRepositoryPort,
} from '../../../../users/domain/ports';

import {
  TRANSACTION_MANAGER,
  TransactionContext,
  TransactionManagerPort,
} from '../../../../shared/domain/ports';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Use case */
import { CreateAccountUseCase } from './create-account.usecase';

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;

  const mockAccountRepository = {
    findByEmail: jest.fn<Promise<Account | null>, [string]>(),
    create: jest.fn<Promise<void>, [Account, object]>(),
  } satisfies Pick<AccountRepositoryPort, 'findByEmail' | 'create'>;

  const mockUserRepository = {
    create: jest.fn<Promise<void>, [User, object]>(),
  } satisfies Pick<UserRepositoryPort, 'create'>;

  const mockTransactionManager = {
    run: jest.fn(),
  } satisfies TransactionManagerPort;

  const createAccountDto = {
    fullname: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    password: 'SecurePass123!',
    roleId: 'role-123',
  };

  const accountId = '11111111-1111-4111-8111-111111111111';
  const userId = '22222222-2222-4222-8222-222222222222';

  const transactionContext: TransactionContext = {};

  beforeEach(async () => {
    jest.resetAllMocks();

    (uuidv4 as jest.Mock)
      .mockReturnValueOnce(accountId)
      .mockReturnValueOnce(userId);

    (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-password');

    mockTransactionManager.run.mockImplementation(
      async (callback: (transactionContext: unknown) => Promise<unknown>) =>
        callback(transactionContext),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateAccountUseCase,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: mockAccountRepository,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    useCase = module.get(CreateAccountUseCase);
  });

  describe('run()', () => {
    it('debe lanzar un error cuando el email ya existe', async () => {
      const existingAccount = new Account(
        'existing-id',
        createAccountDto.email,
        'existing-password-hash',
        false,
        0,
      );

      mockAccountRepository.findByEmail.mockResolvedValue(existingAccount);

      await expect(useCase.run(createAccountDto)).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountAlreadyExists,
        httpCode: 409,
      });

      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith(
        createAccountDto.email,
      );

      expect(mockTransactionManager.run).not.toHaveBeenCalled();
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('debe crear la cuenta y el usuario dentro de una transacción', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      await useCase.run(createAccountDto);

      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith(
        createAccountDto.email,
      );

      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);

      expect(mockAccountRepository.create).toHaveBeenCalledTimes(1);

      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);

      expect(mockAccountRepository.create).toHaveBeenCalledWith(
        expect.any(Account),
        transactionContext,
      );

      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.any(User),
        transactionContext,
      );
    });

    it('debe crear la cuenta con los datos correctos', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      await useCase.run(createAccountDto);

      const createdAccount = mockAccountRepository.create.mock.calls[0][0];

      expect(createdAccount.accountId).toBe(accountId);
      expect(createdAccount.email).toBe(createAccountDto.email);
      expect(createdAccount.passwordHash).toBe('hashed-password');
      expect(createdAccount.mustChangePassword).toBe(false);
      expect(createdAccount.failedAttempts).toBe(0);
    });

    it('debe crear el usuario con los datos correctos', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      await useCase.run(createAccountDto);

      const createdUser = mockUserRepository.create.mock.calls[0][0];

      expect(createdUser.userId).toBe(userId);
      expect(createdUser.fullname).toBe(createAccountDto.fullname);
      expect(createdUser.roleId).toBe(createAccountDto.roleId);
      expect(createdUser.phone).toBe(createAccountDto.phone);
      expect(createdUser.isActive).toBe(true);
    });

    it('debe asociar el usuario con la cuenta creada', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      await useCase.run(createAccountDto);

      const createdAccount = mockAccountRepository.create.mock.calls[0][0];

      const createdUser = mockUserRepository.create.mock.calls[0][0];

      expect(createdUser.accountId).toBe(createdAccount.accountId);
    });

    it('debe generar el hash de la contraseña con bcrypt', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      await useCase.run(createAccountDto);

      expect(bcrypt.hash).toHaveBeenCalledWith(createAccountDto.password, 10);

      const createdAccount = mockAccountRepository.create.mock.calls[0][0];

      expect(createdAccount.passwordHash).toBe('hashed-password');
    });

    it('debe utilizar el mismo contexto transaccional para Account y User', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      await useCase.run(createAccountDto);

      const accountCall = mockAccountRepository.create.mock.calls[0];

      const userCall = mockUserRepository.create.mock.calls[0];

      expect(accountCall[1]).toBe(transactionContext);
      expect(userCall[1]).toBe(transactionContext);
    });

    it('debe propagar el error si falla la creación de la cuenta', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      const databaseError = new Error('Database constraint violation');

      mockAccountRepository.create.mockRejectedValue(databaseError);

      await expect(useCase.run(createAccountDto)).rejects.toThrow(
        databaseError.message,
      );

      expect(mockAccountRepository.create).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('debe propagar el error si falla la creación del usuario', async () => {
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      const databaseError = new Error('Foreign key constraint failed');

      mockUserRepository.create.mockRejectedValue(databaseError);

      await expect(useCase.run(createAccountDto)).rejects.toThrow(
        databaseError.message,
      );

      expect(mockAccountRepository.create).toHaveBeenCalledTimes(1);
      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
    });
  });
});
