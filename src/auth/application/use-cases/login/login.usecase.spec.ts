/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { addHours, addMinutes } from 'date-fns';

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

import { Account, VerificationCode } from '../../../domain/entities';
import { User } from '../../../../users/domain/entities';

import { AppError } from '../../../../shared/domain/exceptions';

import { generateVerificationCode } from '../../../domain/utils/generate-validation-code';

import { LoginDto } from '../../dto';

import { LoginUseCase } from './login.usecase';

jest.mock('uuid', () => ({
  v4: () => 'test-code-id',
}));

jest.mock('../../../domain/utils/generate-validation-code', () => ({
  generateVerificationCode: jest.fn(() => '123456'),
}));

describe('LoginUseCase', () => {
  let useCase: LoginUseCase;
  const validPassword = 'alejo123@';

  const accountRepository = {
    findByEmail: jest.fn(),
    update: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'findByEmail' | 'update'>;

  const verificationCodeRepository = {
    create: jest.fn(),
  } satisfies Pick<VerificationCodeRepositoryPort, 'create'>;

  const emailSenderAdapter = { sendEmail: jest.fn() } satisfies Pick<
    EmailSenderPort,
    'sendEmail'
  >;

  const buildAccount = (overrides: Partial<Account> = {}): Account => ({
    accountId: 'test-account-id',
    email: 'alejo@gmail.com',
    passwordHash: bcrypt.hashSync(validPassword, 10),
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
          useValue: emailSenderAdapter,
        },
      ],
    }).compile();

    useCase = module.get(LoginUseCase);
    accountRepository.findByEmail.mockReset();
    accountRepository.update.mockReset();
    verificationCodeRepository.create.mockReset();
    emailSenderAdapter.sendEmail.mockReset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el email no corresponde a ninguna cuenta', async () => {
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: validPassword,
      };

      accountRepository.findByEmail.mockResolvedValue(null);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);

      const error = (await useCase
        .run(dto)
        .catch((err: AppError) => err)) as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('INVALID_CREDENTIALS');
      expect(error.httpCode).toBe(401);
      expect(accountRepository.findByEmail).toHaveBeenCalledWith(dto.email);
      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSenderAdapter.sendEmail).not.toHaveBeenCalled();
    });

    it('debe incrementar los intentos fallidos y bloquear la cuenta al quinto error', async () => {
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: 'clave-incorrecta',
      };

      const account = buildAccount({ failedAttempts: 4 });
      accountRepository.findByEmail.mockResolvedValue(account);
      accountRepository.update.mockResolvedValue(1);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);

      const error = (await useCase
        .run(dto)
        .catch((err: AppError) => err)) as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('INVALID_CREDENTIALS');
      expect(error.httpCode).toBe(401);
      expect(accountRepository.update).toHaveBeenCalledWith(account.accountId, {
        failedAttempts: 5,
        lockedUtil: expect.any(Date) as Date,
      });
      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSenderAdapter.sendEmail).not.toHaveBeenCalled();
    });

    it('debe rechazar el login si la cuenta está bloqueada todavía', async () => {
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: validPassword,
      };

      const account = buildAccount({
        lockedUtil: addHours(new Date(), 1),
      });

      accountRepository.findByEmail.mockResolvedValue(account);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);

      const error = (await useCase
        .run(dto)
        .catch((err: AppError) => err)) as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('LOGIN_LOCKED');
      expect(error.httpCode).toBe(403);
      expect(accountRepository.update).not.toHaveBeenCalled();
      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSenderAdapter.sendEmail).not.toHaveBeenCalled();
    });

    it('debe resetear el bloqueo cuando este ya expiró y continuar con el flujo de login', async () => {
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: validPassword,
      };

      const account = buildAccount({
        failedAttempts: 3,
        lockedUtil: new Date(Date.now() - 1000),
      });

      accountRepository.findByEmail.mockResolvedValue(account);
      accountRepository.update.mockResolvedValue(1);
      verificationCodeRepository.create.mockResolvedValue(undefined);
      emailSenderAdapter.sendEmail.mockResolvedValue(undefined);

      await expect(useCase.run(dto)).resolves.toBe(account.accountId);

      expect(accountRepository.update).toHaveBeenCalledWith(account.accountId, {
        failedAttempts: 0,
        lockedUtil: undefined,
      });
      expect(verificationCodeRepository.create).toHaveBeenCalledTimes(1);
      expect(emailSenderAdapter.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('debe rechazar el login si la cuenta está inactiva', async () => {
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: validPassword,
      };

      const account = buildAccount({
        profile: new User(
          'user-1',
          'Alejo',
          'test-account-id',
          'role-1',
          undefined,
          undefined,
          false,
        ),
      });

      accountRepository.findByEmail.mockResolvedValue(account);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);

      const error = (await useCase
        .run(dto)
        .catch((err: AppError) => err)) as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('INACTIVE_ACCOUNT');
      expect(error.httpCode).toBe(403);
      expect(verificationCodeRepository.create).not.toHaveBeenCalled();
      expect(emailSenderAdapter.sendEmail).not.toHaveBeenCalled();
    });

    it('debe generar un código de verificación y enviar el email con el contenido correcto', async () => {
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: validPassword,
      };

      const account = buildAccount();
      accountRepository.findByEmail.mockResolvedValue(account);
      verificationCodeRepository.create.mockResolvedValue(undefined);
      emailSenderAdapter.sendEmail.mockResolvedValue(undefined);

      await expect(useCase.run(dto)).resolves.toBe(account.accountId);

      expect(generateVerificationCode).toHaveBeenCalledTimes(1);
      expect(verificationCodeRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          verificationCodeId: 'test-code-id',
          accountId: account.accountId,
          type: 'double-factor',
          attempts: 0,
          expiresAt: expect.any(Date) as Date,
          codeHash: expect.any(String) as string,
        }),
      );
      expect(emailSenderAdapter.sendEmail).toHaveBeenCalledWith(
        account.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('123456'),
      );
      expect(emailSenderAdapter.sendEmail).toHaveBeenCalledWith(
        account.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('10 minutos'),
      );
      expect(verificationCodeRepository.create).toHaveBeenCalledTimes(1);
      expect(emailSenderAdapter.sendEmail).toHaveBeenCalledTimes(1);
    });

    it('debe utilizar una fecha de expiración dentro de 10 minutos para el código', async () => {
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: validPassword,
      };

      const account = buildAccount();
      accountRepository.findByEmail.mockResolvedValue(account);
      verificationCodeRepository.create.mockResolvedValue(undefined);
      emailSenderAdapter.sendEmail.mockResolvedValue(undefined);

      await useCase.run(dto);

      const createdVerificationCode = verificationCodeRepository.create.mock
        .calls[0][0] as VerificationCode;

      expect(createdVerificationCode.expiresAt.getTime()).toBeGreaterThan(
        Date.now(),
      );
      expect(createdVerificationCode.expiresAt.getTime()).toBeLessThanOrEqual(
        addMinutes(new Date(), 10).getTime(),
      );
    });
  });
});
