import { VerificationCode } from '../../../domain/entities';

/** Excepciones de dominio */
import {
  InvalidCodeFormatException,
  InvalidEmailException,
} from '../../../domain/exceptions';

/** Modelos de lectura */
import { AccountLoginModel } from '../../../domain/models';

/** Puertos */
import {
  AccountRepositoryPort,
  DateHandlerPort,
  EncryptorPort,
  VerificationCodeLookupPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import {
  EmailSenderPort,
  IdGeneratorPort,
} from '../../../../shared/domain/ports';

/** Commands */
import { LoginCommand } from '../../commands';

/** Caso de uso */
import { LoginUseCase } from './login.usecase';

/** Excepciones de aplicación */
import {
  AccountLockedException,
  InactiveAccountException,
  InvalidCredentialsException,
} from '../../exceptions';

type AccountRepositoryMock = Pick<
  AccountRepositoryPort,
  'findForLoginByEmail' | 'block' | 'unlock'
>;
type VerificationCodeRepositoryMock = Pick<
  VerificationCodeRepositoryPort,
  'create'
>;
type EmailSenderMock = Pick<EmailSenderPort, 'sendEmail'>;
type EncryptorMock = Pick<EncryptorPort, 'compare' | 'hash'>;
type IdGeneratorMock = Pick<IdGeneratorPort, 'generate'>;
type VerificationCodeLookupMock = Pick<
  VerificationCodeLookupPort,
  'generateLookup'
>;
type DateHandlerMock = Pick<DateHandlerPort, 'addHours' | 'addMinutes'>;

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;
  let verificationCodeRepositoryMock: jest.Mocked<VerificationCodeRepositoryMock>;
  let emailSenderMock: jest.Mocked<EmailSenderMock>;
  let encryptorMock: jest.Mocked<EncryptorMock>;
  let idGeneratorMock: jest.Mocked<IdGeneratorMock>;
  let verificationCodeLookupMock: jest.Mocked<VerificationCodeLookupMock>;
  let dateHandlerMock: jest.Mocked<DateHandlerMock>;

  const loginCommand: LoginCommand = {
    email: 'jhon.doe@example.com',
    password: 'Password123@',
  };

  beforeEach(() => {
    accountRepositoryMock = {
      findForLoginByEmail: jest.fn(),
      block: jest.fn(),
      unlock: jest.fn(),
    };

    verificationCodeRepositoryMock = {
      create: jest.fn(),
    };

    emailSenderMock = {
      sendEmail: jest.fn(),
    };

    encryptorMock = {
      compare: jest.fn(),
      hash: jest.fn(),
    };

    idGeneratorMock = {
      generate: jest.fn(),
    };

    verificationCodeLookupMock = {
      generateLookup: jest.fn(),
    };

    dateHandlerMock = {
      addHours: jest.fn(),
      addMinutes: jest.fn(),
    };

    useCase = new LoginUseCase(
      accountRepositoryMock as unknown as AccountRepositoryPort,
      verificationCodeRepositoryMock as unknown as VerificationCodeRepositoryPort,
      emailSenderMock,
      encryptorMock,
      idGeneratorMock,
      verificationCodeLookupMock,
      dateHandlerMock as unknown as DateHandlerPort,
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('run', () => {
    it('deberia lanzar InvalidEmailException si el correo es invalido', async () => {
      // Arrange
      const invalidEmail = 'jhon.doe';

      // Act
      const result = useCase.run({ ...loginCommand, email: invalidEmail });

      // Assert
      await expect(result).rejects.toThrow(InvalidEmailException);

      expect(accountRepositoryMock.findForLoginByEmail).not.toHaveBeenCalled();
      expect(accountRepositoryMock.unlock).not.toHaveBeenCalled();
      expect(encryptorMock.compare).not.toHaveBeenCalled();
      expect(accountRepositoryMock.block).not.toHaveBeenCalled();
      expect(verificationCodeRepositoryMock.create).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar InvalidCredentialsException cuando la cuenta no existe', async () => {
      // Arrange
      const command = { ...loginCommand, email: 'tom.doe@example.com' };

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(null);

      // Act
      const result = useCase.run(command);

      // Assert
      await expect(result).rejects.toThrow(InvalidCredentialsException);

      expect(accountRepositoryMock.findForLoginByEmail).toHaveBeenCalledWith(
        command.email,
      );

      expect(accountRepositoryMock.unlock).not.toHaveBeenCalled();
      expect(encryptorMock.compare).not.toHaveBeenCalled();
      expect(accountRepositoryMock.block).not.toHaveBeenCalled();
      expect(verificationCodeRepositoryMock.create).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar AccountLockedException cuando la cuenta está bloqueada', async () => {
      // Arrange
      const account: AccountLoginModel = {
        accountId: 'test-account-id',
        passwordHash: 'test-password-hash',
        failedAttempts: 0,
        profile: {
          isActive: true,
        },
        lockedUntil: new Date(Date.now() + 60 * 60 * 1000),
      };

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(account);

      // Act
      const result = useCase.run(loginCommand);

      // Assert
      await expect(result).rejects.toThrow(AccountLockedException);

      expect(accountRepositoryMock.findForLoginByEmail).toHaveBeenCalledWith(
        loginCommand.email,
      );

      expect(accountRepositoryMock.unlock).not.toHaveBeenCalled();
      expect(encryptorMock.compare).not.toHaveBeenCalled();
      expect(accountRepositoryMock.block).not.toHaveBeenCalled();
      expect(verificationCodeRepositoryMock.create).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('debe resetear el bloqueo cuando este ha expirado', async () => {
      // Arrange
      const account: AccountLoginModel = {
        accountId: 'test-account-id',
        passwordHash: 'test-password-hash',
        failedAttempts: 4,
        profile: {
          isActive: true,
        },
        lockedUntil: new Date(Date.now() - 1_000),
      };

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(account);

      accountRepositoryMock.unlock.mockResolvedValue(1);

      encryptorMock.compare.mockResolvedValue(true);

      encryptorMock.hash.mockResolvedValue('verification-code-hash');

      verificationCodeRepositoryMock.create.mockResolvedValue(undefined);
      emailSenderMock.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await useCase.run(loginCommand);

      // Assert
      expect(result).toBeUndefined();

      expect(accountRepositoryMock.unlock).toHaveBeenCalledWith(
        account.accountId,
      );

      expect(account.failedAttempts).toBe(0);
      expect(account.lockedUntil).toBeUndefined();

      expect(encryptorMock.compare).toHaveBeenCalledWith(
        loginCommand.password,
        account.passwordHash,
      );

      expect(verificationCodeRepositoryMock.create).toHaveBeenCalledTimes(1);
      expect(emailSenderMock.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar InactiveAccountException cuando el perfil de la cuenta está inactivo', async () => {
      // Arrange
      const account: AccountLoginModel = {
        accountId: 'test-account-id',
        passwordHash: 'test-password-hash',
        failedAttempts: 0,
        profile: {
          isActive: false,
        },
      };

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(account);

      // Act
      const result = useCase.run(loginCommand);

      // Assert
      await expect(result).rejects.toThrow(InactiveAccountException);

      expect(encryptorMock.compare).not.toHaveBeenCalled();
      expect(accountRepositoryMock.block).not.toHaveBeenCalled();
      expect(verificationCodeRepositoryMock.create).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('debe incrementar los intentos fallidos cuando la contraseña es incorrecta', async () => {
      // Arrange
      const command = {
        ...loginCommand,
        password: 'wrongPassword12@',
      };

      const account: AccountLoginModel = {
        accountId: 'test-account-id',
        passwordHash: 'test-password-hash',
        failedAttempts: 2,
        profile: {
          isActive: true,
        },
      };

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(account);

      encryptorMock.compare.mockResolvedValue(false);

      accountRepositoryMock.block.mockResolvedValue(1);

      // Act
      const result = useCase.run(command);

      // Assert
      await expect(result).rejects.toThrow(InvalidCredentialsException);

      expect(encryptorMock.compare).toHaveBeenCalledWith(
        command.password,
        account.passwordHash,
      );

      expect(accountRepositoryMock.block).toHaveBeenCalledWith(
        account.accountId,
        3,
        undefined,
      );

      expect(verificationCodeRepositoryMock.create).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('debe bloquear la cuenta durante dos horas al alcanzar cinco intentos fallidos', async () => {
      // Arrange
      const command = {
        ...loginCommand,
        password: 'wrongPassword12@',
      };

      const account: AccountLoginModel = {
        accountId: 'test-account-id',
        passwordHash: 'test-password-hash',
        failedAttempts: 4,
        profile: {
          isActive: true,
        },
      };
      const lockedUntil = new Date(Date.now() + 2 * 60 * 60 * 1000);

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(account);

      encryptorMock.compare.mockResolvedValue(false);

      dateHandlerMock.addHours.mockReturnValue(lockedUntil);

      accountRepositoryMock.block.mockResolvedValue(1);

      // Act
      const result = useCase.run(command);

      // Assert
      await expect(result).rejects.toThrow(InvalidCredentialsException);

      expect(accountRepositoryMock.block).toHaveBeenCalledWith(
        account.accountId,
        5,
        lockedUntil,
      );

      const updateCall = accountRepositoryMock.block.mock.calls[0];

      const updatedLockedUntil = updateCall[2];

      expect(updatedLockedUntil).toBeInstanceOf(Date);

      expect(updatedLockedUntil?.getTime()).toBeGreaterThan(Date.now());

      expect(verificationCodeRepositoryMock.create).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('deberia lanzar InvalidCodeFormatException si el código tiene un formato no valido', async () => {
      // Arrange
      const account: AccountLoginModel = {
        accountId: 'test-account-id',
        passwordHash: 'test-password-hash',
        failedAttempts: 0,
        profile: {
          isActive: true,
        },
      };

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(account);

      encryptorMock.compare.mockResolvedValue(true);

      jest.spyOn(VerificationCode, 'generate').mockReturnValue('12345');

      // Act
      const result = useCase.run(loginCommand);

      // Assert
      await expect(result).rejects.toThrow(InvalidCodeFormatException);

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(VerificationCode.generate).toHaveBeenCalledTimes(1);
    });

    it('debe generar y enviar el código de verificación cuando las credenciales son válidas', async () => {
      // Arrange
      const account: AccountLoginModel = {
        accountId: 'test-account-id',
        passwordHash: 'test-password-hash',
        failedAttempts: 0,
        profile: {
          isActive: true,
        },
      };

      accountRepositoryMock.findForLoginByEmail.mockResolvedValue(account);

      encryptorMock.compare.mockResolvedValue(true);

      encryptorMock.hash.mockResolvedValue('verification-code-hash');

      verificationCodeRepositoryMock.create.mockResolvedValue(undefined);

      emailSenderMock.sendEmail.mockResolvedValue(undefined);

      dateHandlerMock.addMinutes.mockReturnValue(
        new Date('2026-08-25T20:10:00.000Z'),
      );

      jest.spyOn(VerificationCode, 'generate').mockReturnValue('123456');

      verificationCodeLookupMock.generateLookup.mockReturnValue(
        'test-code-lookup',
      );

      idGeneratorMock.generate.mockReturnValue('test-code-id');

      // Act
      const result = await useCase.run(loginCommand);

      // Assert
      expect(result).toBeUndefined();

      expect(encryptorMock.compare).toHaveBeenCalledWith(
        loginCommand.password,
        account.passwordHash,
      );

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(VerificationCode.generate).toHaveBeenCalledTimes(1);

      expect(encryptorMock.hash).toHaveBeenCalledWith('123456', 10);

      expect(verificationCodeLookupMock.generateLookup).toHaveBeenCalledWith(
        '123456',
      );

      expect(verificationCodeRepositoryMock.create).toHaveBeenCalledWith(
        expect.any(VerificationCode),
      );

      expect(emailSenderMock.sendEmail).toHaveBeenCalledWith(
        loginCommand.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('123456'),
      );

      expect(emailSenderMock.sendEmail).toHaveBeenCalledWith(
        loginCommand.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('10 minutos'),
      );
    });
  });
});
