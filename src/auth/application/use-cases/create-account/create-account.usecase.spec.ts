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
import { CreateAccountDto } from '../../../infrastructure/dto';

/** Utilidades */
import { buildAccount } from '../../../../shared/application/utils/domain-class-contructor';

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

  const createAccountDto: CreateAccountDto = {
    fullname: 'John Doe',
    phone: '+1234567890',
    email: 'john@example.com',
    password: 'SecurePass123!',
    role: { roleId: 'role-123', name: 'Administrador' },
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
      // Arrange
      const existingEmail: string = 'existing-email@gmail.com';

      const existingAccount = buildAccount({
        accountId: 'existing-id',
        email: existingEmail,
        passwordHash: 'existing-password-hash',
        mustChangePassword: false,
        failedAttempts: 0,
      });

      mockAccountRepository.findByEmail.mockResolvedValue(existingAccount);

      // Act
      const result = useCase.run({ ...createAccountDto, email: existingEmail });

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountAlreadyExists,
        httpCode: 409,
      });

      expect(mockAccountRepository.findByEmail).toHaveBeenCalledWith(
        existingEmail,
      );

      expect(mockTransactionManager.run).not.toHaveBeenCalled();
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
      expect(mockUserRepository.create).not.toHaveBeenCalled();
    });

    it('debe crear la cuenta y el usuario dentro de una transacción', async () => {
      // Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      // Act
      await useCase.run(createAccountDto);

      // Assert
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
      // Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      //Act
      await useCase.run(createAccountDto);

      const createdAccount = mockAccountRepository.create.mock.calls[0][0];

      //Assert
      expect(createdAccount.accountId).toBe(accountId);
      expect(createdAccount.email).toBe(createAccountDto.email);
      expect(createdAccount.passwordHash).toBe('hashed-password');
      expect(createdAccount.mustChangePassword).toBe(false);
      expect(createdAccount.failedAttempts).toBe(0);
    });

    it('debe crear el usuario con los datos correctos', async () => {
      //Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      //Act
      await useCase.run(createAccountDto);

      const createdUser = mockUserRepository.create.mock.calls[0][0];

      //Assert
      expect(createdUser.userId).toBe(userId);
      expect(createdUser.fullname).toBe(createAccountDto.fullname);
      expect(createdUser.role).toMatchObject(createAccountDto.role);
      expect(createdUser.phone).toBe(createAccountDto.phone);
      expect(createdUser.isActive).toBe(true);
    });

    it('debe asociar el cuenta con el perfil creado', async () => {
      //Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      //Act
      await useCase.run(createAccountDto);

      const createdUser = mockUserRepository.create.mock.calls[0][0];
      const createdAccount = mockAccountRepository.create.mock.calls[0][0];

      //Assert
      expect(createdAccount.profile.userId).toBe(createdUser.userId);
    });

    it('debe generar el hash de la contraseña con bcrypt', async () => {
      //Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      //Act
      await useCase.run(createAccountDto);

      //Assert
      expect(bcrypt.hash).toHaveBeenCalledWith(createAccountDto.password, 10);

      const createdAccount = mockAccountRepository.create.mock.calls[0][0];

      expect(createdAccount.passwordHash).toBe('hashed-password');
    });

    it('debe utilizar el mismo contexto transaccional para Account y User', async () => {
      // Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      // Act
      await useCase.run(createAccountDto);

      const accountCall = mockAccountRepository.create.mock.calls[0];

      const userCall = mockUserRepository.create.mock.calls[0];

      // Assert
      expect(accountCall[1]).toBe(transactionContext);
      expect(userCall[1]).toBe(transactionContext);
    });

    it('debe propagar el error si falla la creación del usuario', async () => {
      //Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      const databaseError = new Error('Foreign key constraint failed');

      mockUserRepository.create.mockRejectedValue(databaseError);

      //Act
      const result = useCase.run(createAccountDto);

      //Assert
      await expect(result).rejects.toThrow(databaseError.message);

      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
      expect(mockAccountRepository.create).not.toHaveBeenCalled();
    });

    it('debe propagar el error si falla la creación de la cuenta', async () => {
      // Arrange
      mockAccountRepository.findByEmail.mockResolvedValue(null);

      const databaseError = new Error('Database constraint violation');

      mockAccountRepository.create.mockRejectedValue(databaseError);

      //Act
      const result = useCase.run(createAccountDto);

      //Assert
      await expect(result).rejects.toThrow(databaseError.message);

      expect(mockUserRepository.create).toHaveBeenCalledTimes(1);
      expect(mockAccountRepository.create).toHaveBeenCalledTimes(1);
    });
  });
});
