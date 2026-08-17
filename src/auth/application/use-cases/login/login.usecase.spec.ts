import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { addHours } from 'date-fns';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';

import {
  EMAIL_SENDER_KEY,
  EmailSenderPort,
} from '../../../../shared/domain/ports';

/** Entidades */
import { Account } from '../../../domain/entities';
import { User } from '../../../../users/domain/entities';

/** Tipos */
import { UpdateAccountMetaInput } from '../../../domain/types';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Utils */
import { generateVerificationCode } from '../../../domain/utils/generate-validation-code';

/** DTO */
import { LoginDto } from '../../dto';

/** Caso de uso */
import { LoginUseCase } from './login.usecase';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-verification-code-id'),
}));

jest.mock('../../../domain/utils/generate-validation-code', () => ({
  generateVerificationCode: jest.fn(() => '123456'),
}));

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;

  const accountRepository = {
    findByEmail: jest.fn(),
    update: jest.fn<Promise<number>, [string, UpdateAccountMetaInput]>(),
  } satisfies Pick<AccountRepositoryPort, 'findByEmail' | 'update'>;

  const verificationCodeRepository = {
    create: jest.fn(),
  } satisfies Pick<VerificationCodeRepositoryPort, 'create'>;

  const emailSender = {
    sendEmail: jest.fn(),
  } satisfies Pick<EmailSenderPort, 'sendEmail'>;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => Promise<boolean>
  >(bcrypt.compare);
  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  const generateVerificationCodeMock = jest.mocked(generateVerificationCode);

  const buildLoginDto = (overrides: Partial<LoginDto> = {}): LoginDto => ({
    email: 'alejo@gmail.com',
    password: 'alejo123@',
    ...overrides,
  });

  const buildAccount = (overrides: Partial<Account> = {}): Account => ({
    accountId: 'test-account-id',
    email: 'alejo@gmail.com',
    passwordHash: 'password-hash',
    mustChangePassword: false,
    failedAttempts: 0,
    ...overrides,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginUseCase,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
        {
          provide: VERIFICATION_CODE_REPOSITORY,
          useValue: verificationCodeRepository,
        },
        {
          provide: EMAIL_SENDER_KEY,
          useValue: emailSender,
        },
      ],
    }).compile();

    useCase = module.get<LoginUseCase>(LoginUseCase);

    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar INVALID_CREDENTIALS cuando la cuenta no existe', async () => {
      // Arrange
      const dto = buildLoginDto();

      accountRepository.findByEmail.mockResolvedValue(null);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidCredentials,
        httpCode: 401,
      });

      expect(accountRepository.findByEmail).toHaveBeenCalledWith(dto.email);

      expect(bcryptCompareMock).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar LOGIN_LOCKED cuando la cuenta está bloqueada', async () => {
      // Arrange
      const dto = buildLoginDto();

      const account = buildAccount({
        lockedUtil: addHours(new Date(), 1),
      });

      accountRepository.findByEmail.mockResolvedValue(account);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.loginLocked,
        httpCode: 403,
      });

      expect(accountRepository.findByEmail).toHaveBeenCalledWith(dto.email);

      expect(bcryptCompareMock).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe resetear el bloqueo cuando este ha expirado', async () => {
      // Arrange
      const dto = buildLoginDto();

      const account = buildAccount({
        failedAttempts: 4,
        lockedUtil: new Date(Date.now() - 1_000),
      });

      accountRepository.findByEmail.mockResolvedValue(account);
      accountRepository.update.mockResolvedValue(1);

      bcryptCompareMock.mockResolvedValue(true);

      bcryptHashMock.mockResolvedValue('verification-code-hash');

      verificationCodeRepository.create.mockResolvedValue(undefined);
      emailSender.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await useCase.run(dto);

      // Assert
      expect(result).toBe(account.accountId);

      expect(accountRepository.update).toHaveBeenCalledWith(account.accountId, {
        failedAttempts: 0,
        lockedUtil: undefined,
      });

      expect(account.failedAttempts).toBe(0);
      expect(account.lockedUtil).toBeUndefined();

      expect(bcryptCompareMock).toHaveBeenCalledWith(
        dto.password,
        account.passwordHash,
      );

      expect(verificationCodeRepository.create).toHaveBeenCalledTimes(1);
      expect(emailSender.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('debe lanzar INACTIVE_ACCOUNT cuando el perfil de la cuenta está inactivo', async () => {
      // Arrange
      const dto = buildLoginDto();

      const account = buildAccount({
        profile: new User(
          'user-id',
          'Alejo',
          'test-account-id',
          'role-id',
          undefined,
          undefined,
          false,
        ),
      });

      accountRepository.findByEmail.mockResolvedValue(account);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.inactiveAccount,
        httpCode: 403,
      });

      expect(bcryptCompareMock).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe incrementar los intentos fallidos cuando la contraseña es incorrecta', async () => {
      // Arrange
      const dto = buildLoginDto({
        password: 'password-incorrecto',
      });

      const account = buildAccount({
        failedAttempts: 2,
      });

      accountRepository.findByEmail.mockResolvedValue(account);

      bcryptCompareMock.mockResolvedValue(false);

      accountRepository.update.mockResolvedValue(1);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidCredentials,
        httpCode: 401,
      });

      expect(bcryptCompareMock).toHaveBeenCalledWith(
        dto.password,
        account.passwordHash,
      );

      expect(accountRepository.update).toHaveBeenCalledWith(account.accountId, {
        failedAttempts: 3,
        lockedUtil: undefined,
      });

      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe bloquear la cuenta durante dos horas al alcanzar cinco intentos fallidos', async () => {
      // Arrange
      const dto = buildLoginDto({
        password: 'password-incorrecto',
      });

      const account = buildAccount({
        failedAttempts: 4,
      });

      accountRepository.findByEmail.mockResolvedValue(account);

      bcryptCompareMock.mockResolvedValue(false);

      accountRepository.update.mockResolvedValue(1);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidCredentials,
        httpCode: 401,
      });

      expect(accountRepository.update).toHaveBeenCalledWith(account.accountId, {
        failedAttempts: 5,
        lockedUtil: expect.any(Date) as Date,
      });

      const updateCall = accountRepository.update.mock.calls[0];

      const updateData = updateCall[1] as {
        failedAttempts: number;
        lockedUtil?: Date;
      };

      expect(updateData.lockedUtil).toBeInstanceOf(Date);

      expect(updateData.lockedUtil!.getTime()).toBeGreaterThan(Date.now());

      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe generar y enviar el código de verificación cuando las credenciales son válidas', async () => {
      // Arrange
      const dto = buildLoginDto();

      const account = buildAccount();

      accountRepository.findByEmail.mockResolvedValue(account);

      bcryptCompareMock.mockResolvedValue(true);

      bcryptHashMock.mockResolvedValue('verification-code-hash');

      verificationCodeRepository.create.mockResolvedValue(undefined);

      emailSender.sendEmail.mockResolvedValue(undefined);

      // Act
      const result = await useCase.run(dto);

      // Assert
      expect(result).toBe(account.accountId);

      expect(generateVerificationCodeMock).toHaveBeenCalledTimes(1);

      expect(bcryptCompareMock).toHaveBeenCalledWith(
        dto.password,
        account.passwordHash,
      );

      expect(bcryptHashMock).toHaveBeenCalledWith('123456', 10);

      expect(verificationCodeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationCodeId: 'test-verification-code-id',
          accountId: account.accountId,
          codeHash: 'verification-code-hash',
          type: 'double-factor',
          attempts: 0,
          expiresAt: expect.any(Date) as Date,
        }),
      );

      expect(emailSender.sendEmail).toHaveBeenCalledWith(
        account.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('123456'),
      );

      expect(emailSender.sendEmail).toHaveBeenCalledWith(
        account.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('10 minutos'),
      );
    });
  });
});
