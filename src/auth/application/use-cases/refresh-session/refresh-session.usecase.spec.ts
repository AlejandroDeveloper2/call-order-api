import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../../../domain/ports';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Caso de uso */
import { RefreshSessionUseCase } from './refresh-session.usecase';

/** Utilidades */
import {
  buildAccount,
  buildSession,
} from '../../../../shared/application/utils/domain-class-contructor';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  compareSync: jest.fn(),
  hash: jest.fn(),
}));

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;

  const jwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  } satisfies Pick<JwtService, 'verify' | 'sign'>;

  const sessionRepository = {
    update: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'update'>;

  const accountRepository = {
    findById: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'findById'>;

  const bcryptCompareSyncMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => boolean
  >(bcrypt.compareSync);
  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => Promise<boolean>
  >(bcrypt.compare);
  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RefreshSessionUseCase,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: SESSION_REPOSITORY,
          useValue: sessionRepository,
        },
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
      ],
    }).compile();

    useCase = module.get<RefreshSessionUseCase>(RefreshSessionUseCase);

    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar AppError cuando la cuenta no existe', async () => {
      // Arrange
      const accountId = 'wrong-account-id';
      const oldToken = 'test-old-wrong-token';
      const refreshToken = 'test-refresh-token';

      accountRepository.findById.mockResolvedValue(null);

      // Act
      const result = useCase.run(accountId, oldToken, refreshToken);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountNotFound,
        httpCode: 404,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);
      expect(sessionRepository.update).not.toHaveBeenCalled();
      expect(jwtService.verify).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
      expect(bcryptCompareSyncMock).not.toHaveBeenCalled();
      expect(bcryptCompareMock).not.toHaveBeenCalled();
      expect(bcryptHashMock).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando la sesión no es válida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const oldToken = 'test-old-wrong-token';
      const refreshToken = 'test-refresh-token';

      const session = buildSession();
      const account = buildAccount({ sessions: [session] });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareSyncMock.mockReturnValue(false);

      // Act
      const result = useCase.run(accountId, oldToken, refreshToken);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);

      expect(sessionRepository.update).not.toHaveBeenCalled();

      expect(jwtService.verify).not.toHaveBeenCalled();

      expect(jwtService.sign).not.toHaveBeenCalled();

      expect(bcryptCompareMock).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el refresh token no es válido', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const oldToken = 'test-old-token';
      const refreshToken = 'test-wrong-refresh-token';

      const session = buildSession();
      const account = buildAccount({ sessions: [session] });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareSyncMock.mockReturnValue(true);

      bcryptCompareMock.mockResolvedValue(false);

      // Act
      const result = useCase.run(accountId, oldToken, refreshToken);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);

      expect(sessionRepository.update).not.toHaveBeenCalled();

      expect(jwtService.verify).not.toHaveBeenCalled();

      expect(jwtService.sign).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();
    });

    it('debe retornar el nuevo token y refresh token cuando la sesión es válida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const oldToken = 'test-old-token';
      const refreshToken = 'test-old-refresh-token';
      const jwtPayload = {
        accountId: 'test-account-id',
        roleId: 'test-role-id',
        profileId: 'test-profile-id',
      };

      const session = buildSession();
      const account = buildAccount({ sessions: [session] });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareSyncMock.mockReturnValue(true);

      bcryptCompareMock.mockResolvedValue(true);

      jwtService.sign.mockReturnValue('new-token');

      jwtService.verify.mockReturnValue(jwtPayload);

      bcryptHashMock
        .mockResolvedValueOnce('new-token-hash')
        .mockResolvedValueOnce('new-refresh-token-hash');

      // Act
      const result = await useCase.run(accountId, oldToken, refreshToken);

      // Assert
      expect(result.token).toBe('new-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).toHaveLength(128);

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);

      expect(jwtService.verify).toHaveBeenCalledTimes(1);

      expect(jwtService.verify).toHaveBeenCalledWith(oldToken, {
        ignoreExpiration: true,
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(1);

      expect(jwtService.sign).toHaveBeenCalledWith(jwtPayload);

      expect(bcryptHashMock).toHaveBeenCalledTimes(2);

      expect(sessionRepository.update).toHaveBeenCalledWith('test-session-id', {
        tokenHash: 'new-token-hash',
        refreshTokenHash: expect.any(String) as string,
        lastActivityAt: expect.any(Date) as Date,
        expiresAt: expect.any(Date) as Date,
      });
    });
  });
});
