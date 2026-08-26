import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { addMinutes } from 'date-fns';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  SESSION_REPOSITORY,
  SessionRepositoryPort,
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import {
  TRANSACTION_MANAGER,
  TransactionContext,
  TransactionManagerPort,
} from '../../../../shared/domain/ports';

/** Entidades de dominio */
import { Session } from '../../../domain/entities';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Caso de uso */
import { ValidateIdentityUseCase } from './validate-identity.usecase';

/** DTO */
import { ValidateIdentityDto } from '../../../infrastructure/dto';

/** utilidades */
import {
  buildAccount,
  buildVerificationCode,
} from '../../../../shared/application/utils/domain-class-contructor';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-session-id'),
}));

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
  hash: jest.fn(),
}));

describe('ValidateIdentityUseCase', () => {
  let useCase: ValidateIdentityUseCase;

  const jwtService = {
    sign: jest.fn(),
  } satisfies Pick<JwtService, 'sign'>;

  const verificationCodeRepository = {
    update: jest.fn(),
  } satisfies Pick<VerificationCodeRepositoryPort, 'update'>;

  const sessionRepository = {
    create: jest.fn(),
    revokeByAccountId: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'create' | 'revokeByAccountId'>;

  const accountRepository = {
    findById: jest.fn(),
    update: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'update' | 'findById'>;

  const mockTransactionManager = {
    run: jest.fn(),
  } satisfies TransactionManagerPort;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => boolean
  >(bcrypt.compareSync);
  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  const buildDto = (
    overrides: Partial<ValidateIdentityDto> = {},
  ): ValidateIdentityDto => ({
    accountId: 'test-account-id',
    verificationCode: '123456',
    ...overrides,
  });

  const transactionContext: TransactionContext = {};

  beforeEach(async () => {
    mockTransactionManager.run.mockImplementation(
      async (callback: (transactionContext: unknown) => Promise<unknown>) =>
        callback(transactionContext),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateIdentityUseCase,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: VERIFICATION_CODE_REPOSITORY,
          useValue: verificationCodeRepository,
        },
        {
          provide: SESSION_REPOSITORY,
          useValue: sessionRepository,
        },
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
        {
          provide: TRANSACTION_MANAGER,
          useValue: mockTransactionManager,
        },
      ],
    }).compile();

    useCase = module.get<ValidateIdentityUseCase>(ValidateIdentityUseCase);

    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar AppError cuando la cuenta no existe', async () => {
      // Arrange
      const accountId = 'wrong-account-id';
      const dto = buildDto({ accountId });

      accountRepository.findById.mockResolvedValue(null);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountNotFound,
        httpCode: 404,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);

      expect(bcryptCompareMock).not.toHaveBeenCalled();

      expect(jwtService.sign).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();

      expect(sessionRepository.revokeByAccountId).not.toHaveBeenCalled();

      expect(mockTransactionManager.run).not.toHaveBeenCalled();

      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(verificationCodeRepository.update).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el código ingresado no es válido', async () => {
      // Arrange
      const dto = buildDto();

      const verificationCode = buildVerificationCode();
      const account = buildAccount({ verificationCodes: [verificationCode] });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(false);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidCode,
        httpCode: 401,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(dto.accountId);

      expect(jwtService.sign).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();

      expect(sessionRepository.revokeByAccountId).not.toHaveBeenCalled();

      expect(mockTransactionManager.run).not.toHaveBeenCalled();

      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(verificationCodeRepository.update).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el código ha expirado', async () => {
      // Arrange
      const dto = buildDto();

      const expiredVerificationCode = buildVerificationCode({
        expiresAt: addMinutes(new Date(), -5),
      });
      const account = buildAccount({
        verificationCodes: [expiredVerificationCode],
      });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(true);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.expiredCode,
        httpCode: 401,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(dto.accountId);

      expect(jwtService.sign).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();

      expect(sessionRepository.revokeByAccountId).not.toHaveBeenCalled();

      expect(mockTransactionManager.run).not.toHaveBeenCalled();
      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(verificationCodeRepository.update).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
    });

    it('debe crear una nueva sesión, invalidar el código, marcar el último inicio de sesión dentro de una transacción y retornar los tokens cuando la identidad es válida', async () => {
      // Arrange
      const dto = buildDto({
        browser: 'Chrome',
        operatingSystem: 'Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        deviceName: 'PC',
        deviceType: 'desktop',
      });

      const validVerificationCode = buildVerificationCode();
      const account = buildAccount({
        verificationCodes: [validVerificationCode],
      });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(true);

      jwtService.sign.mockReturnValue('access-token');

      bcryptHashMock
        .mockResolvedValueOnce('access-token-hash')
        .mockResolvedValueOnce('refresh-token-hash');

      sessionRepository.revokeByAccountId.mockResolvedValue(undefined);
      sessionRepository.create.mockResolvedValue(undefined);
      verificationCodeRepository.update.mockResolvedValue(undefined);
      accountRepository.update.mockResolvedValue(undefined);

      // Act
      const result = await useCase.run(dto);

      // Assert
      expect(result.token).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).toHaveLength(128);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);

      expect(jwtService.sign).toHaveBeenCalledWith({
        accountId: dto.accountId,
        roleId: account.profile.role.roleId,
        profileId: account.profile.userId,
      });

      expect(bcryptHashMock).toHaveBeenCalledTimes(2);

      expect(sessionRepository.revokeByAccountId).toHaveBeenCalledTimes(1);

      expect(sessionRepository.revokeByAccountId).toHaveBeenCalledWith(
        dto.accountId,
        expect.any(Date),
      );

      expect(mockTransactionManager.run).toHaveBeenCalledTimes(1);

      expect(sessionRepository.create).toHaveBeenCalledTimes(1);
      expect(verificationCodeRepository.update).toHaveBeenCalledTimes(1);
      expect(accountRepository.update).toHaveBeenCalledTimes(1);

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.any(Session),
        transactionContext,
      );

      expect(verificationCodeRepository.update).toHaveBeenCalledWith(
        validVerificationCode.verificationCodeId,
        expect.objectContaining({
          usedAt: expect.any(Date) as Date,
        }),
        transactionContext,
      );

      expect(accountRepository.update).toHaveBeenCalledWith(
        dto.accountId,
        expect.objectContaining({
          lastLoginAt: expect.any(Date) as Date,
        }),
        transactionContext,
      );
    });
  });
});
