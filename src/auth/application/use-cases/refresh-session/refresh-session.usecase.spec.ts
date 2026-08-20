import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { addDays } from 'date-fns';

/** Entidades de dominio */
import { Session } from '../../../domain/entities';

/** Puertos */
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../../../domain/ports';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Caso de uso */
import { RefreshSessionUseCase } from './refresh-session.usecase';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;

  const jwtService = {
    verify: jest.fn(),
    sign: jest.fn(),
  } satisfies Pick<JwtService, 'verify' | 'sign'>;

  const sessionRepository = {
    findByAccountId: jest.fn(),
    update: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'findByAccountId' | 'update'>;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => Promise<boolean>
  >(bcrypt.compare);
  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  const buildSession = (overrides: Partial<Session> = {}): Session => {
    const session = new Session(
      'test-session-id',
      'test-account-id',
      'test-token-hash',
      'test-refresh-token-hash',
      addDays(new Date(), 1),
      new Date(),
      'browser',
      'operating-system',
      'ip-address',
      'user-agent',
      undefined,
      'device-name',
      'device-type',
    );

    Object.assign(session, overrides);

    return session;
  };

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
      ],
    }).compile();

    useCase = module.get<RefreshSessionUseCase>(RefreshSessionUseCase);

    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar AppError cuando la sesión no es válida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const oldToken = 'test-old-wrong-token';
      const refreshToken = 'test-refresh-token';

      sessionRepository.findByAccountId.mockResolvedValue([]);

      bcryptCompareMock.mockResolvedValue(false);

      // Act
      const result = useCase.run(accountId, oldToken, refreshToken);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });

      expect(sessionRepository.findByAccountId).toHaveBeenCalledWith(accountId);
      expect(sessionRepository.update).not.toHaveBeenCalled();
      expect(jwtService.verify).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el refresh token no es válido', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const oldToken = 'test-old-token';
      const refreshToken = 'test-wrong-refresh-token';

      const session = buildSession({
        accountId,
        tokenHash: oldToken,
        refreshTokenHash: refreshToken,
      });

      sessionRepository.findByAccountId.mockResolvedValue([session]);

      bcryptCompareMock.mockResolvedValue(false);

      // Act
      const result = useCase.run(accountId, oldToken, refreshToken);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });

      expect(sessionRepository.findByAccountId).toHaveBeenCalledWith(accountId);
      expect(sessionRepository.update).not.toHaveBeenCalled();
      expect(jwtService.verify).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('debe retornar el nuevo token y refresh token cuando la sesión es válida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const oldToken = 'test-old-token';
      const refreshToken = 'test-old-refresh-token';

      const session = buildSession({
        accountId,
        tokenHash: oldToken,
        refreshTokenHash: refreshToken,
      });

      sessionRepository.findByAccountId.mockResolvedValue([session]);

      bcryptCompareMock.mockResolvedValue(true);

      jwtService.sign.mockReturnValue('new-token');

      jwtService.verify.mockReturnValue({
        accountId: 'test-account-id',
        roleId: undefined,
        profileId: undefined,
      });

      bcryptHashMock
        .mockResolvedValueOnce('new-token-hash')
        .mockResolvedValueOnce('new-refresh-token-hash');

      // Act
      const result = await useCase.run(accountId, oldToken, refreshToken);

      // Assert
      expect(result.token).toBe('new-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).toHaveLength(128);

      expect(sessionRepository.findByAccountId).toHaveBeenCalledWith(accountId);

      expect(jwtService.verify).toHaveBeenCalledTimes(1);

      expect(jwtService.verify).toHaveBeenCalledWith(oldToken, {
        ignoreExpiration: true,
      });

      expect(jwtService.sign).toHaveBeenCalledTimes(1);

      expect(jwtService.sign).toHaveBeenCalledWith({
        accountId: 'test-account-id',
        roleId: undefined,
        profileId: undefined,
      });

      expect(bcrypt.hash).toHaveBeenCalledTimes(2);

      expect(sessionRepository.update).toHaveBeenCalledWith('test-session-id', {
        tokenHash: 'new-token-hash',
        refreshTokenHash: expect.any(String) as string,
        lastActivityAt: expect.any(Date) as Date,
        expiresAt: expect.any(Date) as Date,
      });
    });
  });
});
