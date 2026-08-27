/** Entidades */
import { Account } from '../../../domain/entities';
import { User } from '../../../../users/domain/entities';

/** Puertos */
import { AccountRepositoryPort, EncryptorPort } from '../../../domain/ports';
import { UserRepositoryPort } from '../../../../users/domain/ports';
import {
  IdGeneratorPort,
  TransactionContext,
  TransactionManagerPort,
} from '../../../../shared/domain/ports';

/** Excepciones de dominio */
import {
  InvalidEmailException,
  InvalidPasswordException,
} from '../../../domain/exceptions';
import {
  InvalidFullnameException,
  InvalidPhoneException,
} from '../../../../shared/domain/exceptions';

/** Casos de uso */
import { CreateAccountUseCase } from './create-account.usecase';

/** Commands */
import { CreateAccountCommand } from '../../commands';

/** Excepciones de aplicación */
import { AccountAlreadyExistsException } from '../../exceptions';

type AccountRepositoryMock = Pick<
  AccountRepositoryPort,
  'verifyByEmail' | 'create'
>;
type UserRepositoryMock = Pick<UserRepositoryPort, 'create'>;
type TransactionManagerMock = Pick<TransactionManagerPort, 'run'>;
type EncryptorMock = Pick<EncryptorPort, 'compare' | 'hash'>;
type IdGeneratorMock = Pick<IdGeneratorPort, 'generate'>;

describe('CreateAccountUseCase', () => {
  let useCase: CreateAccountUseCase;
  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;
  let userRepositoryMock: jest.Mocked<UserRepositoryMock>;
  let transactionManagerMock: jest.Mocked<TransactionManagerMock>;
  let encryptorMock: jest.Mocked<EncryptorMock>;
  let idGeneratorMock: jest.Mocked<IdGeneratorMock>;

  const createAccountCommand: CreateAccountCommand = {
    fullname: 'John Doe',
    phone: '3105668544',
    email: 'john@example.com',
    password: 'SecurePass123!@',
    roleId: 'test-role-id',
  };

  const accountId = 'test-account-id';
  const userId = 'test-user-id';
  const hashedPassword = 'test-hashed-password';

  const transactionContext: TransactionContext = {};

  beforeEach(() => {
    accountRepositoryMock = {
      verifyByEmail: jest.fn(),
      create: jest.fn(),
    };
    userRepositoryMock = {
      create: jest.fn(),
    };
    transactionManagerMock = {
      run: jest.fn(
        <T>(
          callback: (context: TransactionContext) => Promise<T>,
        ): Promise<T> => {
          return callback(transactionContext);
        },
      ),
    } as jest.Mocked<TransactionManagerMock>;
    encryptorMock = {
      compare: jest.fn(),
      hash: jest.fn().mockResolvedValueOnce(hashedPassword),
    };
    idGeneratorMock = {
      generate: jest
        .fn()
        .mockReturnValueOnce(accountId)
        .mockReturnValueOnce(userId),
    };

    useCase = new CreateAccountUseCase(
      accountRepositoryMock as unknown as AccountRepositoryPort,
      userRepositoryMock as unknown as UserRepositoryPort,
      transactionManagerMock,
      encryptorMock,
      idGeneratorMock,
    );

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('deberia lanzar un InvalidEmailException si el correo electrónico es invalido', async () => {
      // Arrange
      const command = {
        ...createAccountCommand,
        email: 'jhon.doe',
      };

      // Act
      const result = useCase.run(command);

      // Assert
      await expect(result).rejects.toThrow(InvalidEmailException);

      expect(accountRepositoryMock.verifyByEmail).not.toHaveBeenCalled();
      expect(idGeneratorMock.generate).not.toHaveBeenCalled();
      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(transactionManagerMock.run).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(accountRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('deberia lanzar un InvalidPasswordException si la contraseña es invalida', async () => {
      // Arrange
      const command = {
        ...createAccountCommand,
        password: '123456',
      };

      // Act
      const result = useCase.run(command);

      // Assert
      await expect(result).rejects.toThrow(InvalidPasswordException);

      expect(accountRepositoryMock.verifyByEmail).not.toHaveBeenCalled();
      expect(idGeneratorMock.generate).not.toHaveBeenCalled();
      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(transactionManagerMock.run).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(accountRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('deberia lanzar un InvalidFullnameException si el nombre tiene un formato invalido', async () => {
      // Arrange
      const command = {
        ...createAccountCommand,
        fullname: 'n',
      };

      // Act
      const result = useCase.run(command);

      // Assert
      await expect(result).rejects.toThrow(InvalidFullnameException);

      expect(accountRepositoryMock.verifyByEmail).not.toHaveBeenCalled();
      expect(idGeneratorMock.generate).not.toHaveBeenCalled();
      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(transactionManagerMock.run).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(accountRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('deberia lanzar un InvalidPhoneException si el teléfono tiene un formato invalido', async () => {
      // Arrange
      const command = {
        ...createAccountCommand,
        phone: '456154a',
      };

      // Act
      const result = useCase.run(command);

      // Assert
      await expect(result).rejects.toThrow(InvalidPhoneException);

      expect(accountRepositoryMock.verifyByEmail).not.toHaveBeenCalled();
      expect(idGeneratorMock.generate).not.toHaveBeenCalled();
      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(transactionManagerMock.run).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(accountRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe lanzar un AccountAlreadyExistsException cuando el email ya existe', async () => {
      // Arrange
      const existingEmail: string = 'juan.doe@example.com';

      accountRepositoryMock.verifyByEmail.mockResolvedValue(true);

      // Act
      const result = useCase.run({
        ...createAccountCommand,
        email: existingEmail,
      });

      // Assert
      await expect(result).rejects.toThrow(AccountAlreadyExistsException);

      expect(accountRepositoryMock.verifyByEmail).toHaveBeenCalledWith(
        existingEmail,
      );

      expect(idGeneratorMock.generate).not.toHaveBeenCalled();
      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(transactionManagerMock.run).not.toHaveBeenCalled();
      expect(userRepositoryMock.create).not.toHaveBeenCalled();
      expect(accountRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe crear la cuenta y el usuario dentro de una transacción', async () => {
      // Arrange
      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      // Act
      await useCase.run(createAccountCommand);

      // Assert
      expect(accountRepositoryMock.verifyByEmail).toHaveBeenCalledWith(
        createAccountCommand.email,
      );

      expect(transactionManagerMock.run).toHaveBeenCalledTimes(1);

      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);

      expect(accountRepositoryMock.create).toHaveBeenCalledTimes(1);

      expect(userRepositoryMock.create).toHaveBeenCalledWith(
        expect.any(User),
        transactionContext,
      );

      expect(accountRepositoryMock.create).toHaveBeenCalledWith(
        expect.any(Account),
        transactionContext,
      );
    });

    it('debe crear la cuenta con los datos correctos', async () => {
      // Arrange
      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      //Act
      await useCase.run(createAccountCommand);

      const createdAccount = accountRepositoryMock.create.mock.calls[0][0];

      //Assert
      expect(createdAccount.getAccountId).toBe(accountId);
      expect(createdAccount.getEmail).toBe(createAccountCommand.email);
      expect(createdAccount.getPasswordHash).toBe(hashedPassword);
      expect(createdAccount.getMustChangePassword).toBe(false);
      expect(createdAccount.getFailedAttempts).toBe(0);
    });

    it('debe crear el usuario con los datos correctos', async () => {
      //Arrange
      const normalizedPhone = `+57${createAccountCommand.phone}`;

      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      //Act
      await useCase.run(createAccountCommand);

      const createdUser = userRepositoryMock.create.mock.calls[0][0];

      //Assert
      expect(createdUser.getUserId).toBe(userId);
      expect(createdUser.getFullname).toBe(createAccountCommand.fullname);
      expect(createdUser.getRoleId).toBe(createAccountCommand.roleId);
      expect(createdUser.getPhone).toBe(normalizedPhone.trim());
      expect(createdUser.getIsActive).toBe(true);
    });

    it('debe asociar el cuenta con el perfil creado', async () => {
      //Arrange
      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      //Act
      await useCase.run(createAccountCommand);

      const createdUser = userRepositoryMock.create.mock.calls[0][0];
      const createdAccount = accountRepositoryMock.create.mock.calls[0][0];

      //Assert
      expect(createdAccount.getProfileId).toBe(createdUser.getUserId);
    });

    it('debe generar el hash de la contraseña con el cifrador', async () => {
      //Arrange
      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      //Act
      await useCase.run(createAccountCommand);

      //Assert
      expect(encryptorMock.hash).toHaveBeenCalledWith(
        createAccountCommand.password,
        14,
      );

      const createdAccount = accountRepositoryMock.create.mock.calls[0][0];

      expect(createdAccount.getPasswordHash).toBe(hashedPassword);
    });

    it('debe utilizar el mismo contexto transaccional para Account y User', async () => {
      // Arrange
      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      // Act
      await useCase.run(createAccountCommand);

      const accountCall = accountRepositoryMock.create.mock.calls[0];
      const userCall = userRepositoryMock.create.mock.calls[0];

      // Assert
      expect(accountCall[1]).toBe(transactionContext);
      expect(userCall[1]).toBe(transactionContext);
    });

    it('debe propagar el error si falla la creación del usuario', async () => {
      //Arrange
      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      const databaseError = new Error('Foreign key constraint failed');

      userRepositoryMock.create.mockRejectedValue(databaseError);

      //Act
      const result = useCase.run(createAccountCommand);

      //Assert
      await expect(result).rejects.toThrow(databaseError.message);

      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(accountRepositoryMock.create).not.toHaveBeenCalled();
    });

    it('debe propagar el error si falla la creación de la cuenta', async () => {
      // Arrange
      accountRepositoryMock.verifyByEmail.mockResolvedValue(false);

      const databaseError = new Error('Database constraint violation');

      accountRepositoryMock.create.mockRejectedValue(databaseError);

      //Act
      const result = useCase.run(createAccountCommand);

      //Assert
      await expect(result).rejects.toThrow(databaseError.message);

      expect(userRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(accountRepositoryMock.create).toHaveBeenCalledTimes(1);
    });
  });
});
