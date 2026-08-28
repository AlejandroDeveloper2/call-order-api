/** Puertos */
import {
  AccessTokenGeneratorPort,
  AccessTokenVerifierPort,
  RefreshTokenGeneratorPort,
  SessionRepositoryPort,
  TokenHasherPort,
} from '../../../domain/ports';
import { DateHandlerPort } from '../../../../shared/domain/ports';

/** Excepciones de dominio */
import {
  InvalidRefreshTokenException,
  InvalidTokenException,
} from '../../../domain/exceptions';

/** Modelos de lectura */
import { SessionToUpdateModel } from '../../../domain/models';

/** Caso de uso */
import { RefreshSessionUseCase } from './refresh-session.usecase';

/** Excepciones de aplicación */
import { InvalidSessionException } from '../../exceptions';

type SessionRepositoryMock = Pick<
  SessionRepositoryPort,
  'findActiveToUpdate' | 'refresh'
>;
type TokenHasherMock = Pick<TokenHasherPort, 'compare' | 'hash'>;
type AccessTokenGeneratorMock = Pick<AccessTokenGeneratorPort, 'generate'>;
type AccessTokenVerifierMock = Pick<AccessTokenVerifierPort, 'verify'>;
type RefreshTokenGeneratorMock = Pick<RefreshTokenGeneratorPort, 'generate'>;
type DateHandlerMock = Pick<DateHandlerPort, 'addDays'>;

describe('RefreshSessionUseCase', () => {
  let useCase: RefreshSessionUseCase;
  let sessionRepositoryMock: jest.Mocked<SessionRepositoryMock>;
  let tokenHasherMock: jest.Mocked<TokenHasherMock>;
  let accessTokenGeneratorMock: jest.Mocked<AccessTokenGeneratorMock>;
  let accessTokenVerifierMock: jest.Mocked<AccessTokenVerifierMock>;
  let refreshTokenGeneratorMock: jest.Mocked<RefreshTokenGeneratorMock>;
  let dateHandlerMock: jest.Mocked<DateHandlerMock>;

  beforeEach(() => {
    sessionRepositoryMock = {
      findActiveToUpdate: jest.fn(),
      refresh: jest.fn(),
    };

    tokenHasherMock = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    accessTokenGeneratorMock = {
      generate: jest.fn(),
    };

    accessTokenVerifierMock = {
      verify: jest.fn(),
    };

    refreshTokenGeneratorMock = {
      generate: jest.fn(),
    };

    dateHandlerMock = {
      addDays: jest.fn(),
    };

    useCase = new RefreshSessionUseCase(
      sessionRepositoryMock as unknown as SessionRepositoryPort,
      tokenHasherMock,
      accessTokenGeneratorMock,
      accessTokenVerifierMock,
      refreshTokenGeneratorMock,
      dateHandlerMock as unknown as DateHandlerPort,
    );

    jest.clearAllMocks();
  });

  const accountId = 'test-account-id';
  const session: SessionToUpdateModel = {
    sessionId: 'test-session-id',
    tokenHash: 'stored-token-hash',
    refreshTokenHash: 'stored-refresh-token-hash',
  };
  const oldToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
  const oldRefreshToken =
    '3de3bc8b981cfecb3116b1a643163886e011fbfd877aba391298b1f3a56c012f8b3bcfb55643a08372ddcd3d1ab0c939e83fc236360ec289f9444b6c0cc9a7d0';

  describe('run', () => {
    it('deberia lanzar InvalidTokenException si el token no tiene un formato invalido', async () => {
      // Arrange
      const invalidToken = 'token-1';

      // Act
      const result = useCase.run(accountId, invalidToken, oldRefreshToken);

      // Assert
      await expect(result).rejects.toThrow(InvalidTokenException);

      expect(sessionRepositoryMock.findActiveToUpdate).not.toHaveBeenCalled();
      expect(tokenHasherMock.compare).not.toHaveBeenCalled();
      expect(accessTokenVerifierMock.verify).not.toHaveBeenCalled();
      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(refreshTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(tokenHasherMock.hash).not.toHaveBeenCalled();
      expect(sessionRepositoryMock.refresh).not.toHaveBeenCalled();
    });

    it('deberia lanzar InvalidRefreshTokenException si el refresh token no tiene un formato invalido', async () => {
      // Arrange
      const invalidRefreshToken = 'refresh-token-1';

      // Act
      const result = useCase.run(accountId, oldToken, invalidRefreshToken);

      // Assert
      await expect(result).rejects.toThrow(InvalidRefreshTokenException);

      expect(sessionRepositoryMock.findActiveToUpdate).not.toHaveBeenCalled();
      expect(tokenHasherMock.compare).not.toHaveBeenCalled();
      expect(accessTokenVerifierMock.verify).not.toHaveBeenCalled();
      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(refreshTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(tokenHasherMock.hash).not.toHaveBeenCalled();
      expect(sessionRepositoryMock.refresh).not.toHaveBeenCalled();
    });

    it('debe lanzar InvalidSessionException cuando la ID de cuenta no corresponde a ninguna sesión registrada', async () => {
      // Arrange
      const wrongAccountId = 'wrong-account-id';

      sessionRepositoryMock.findActiveToUpdate.mockResolvedValue(null);

      // Act
      const result = useCase.run(wrongAccountId, oldToken, oldRefreshToken);

      // Assert
      await expect(result).rejects.toThrow(InvalidSessionException);

      expect(sessionRepositoryMock.findActiveToUpdate).toHaveBeenCalledWith(
        wrongAccountId,
      );

      expect(tokenHasherMock.compare).not.toHaveBeenCalled();
      expect(accessTokenVerifierMock.verify).not.toHaveBeenCalled();
      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(refreshTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(tokenHasherMock.hash).not.toHaveBeenCalled();
      expect(sessionRepositoryMock.refresh).not.toHaveBeenCalled();
    });

    it('debe lanzar InvalidSessionException cuando el access token no es válido', async () => {
      // Arrange
      const oldWrongToken = oldToken;

      sessionRepositoryMock.findActiveToUpdate.mockResolvedValue(session);

      tokenHasherMock.compare.mockReturnValue(false);

      // Act
      const result = useCase.run(accountId, oldWrongToken, oldRefreshToken);

      // Assert
      await expect(result).rejects.toThrow(InvalidSessionException);

      expect(sessionRepositoryMock.findActiveToUpdate).toHaveBeenCalledWith(
        accountId,
      );
      expect(tokenHasherMock.compare).toHaveBeenCalledTimes(1);

      expect(accessTokenVerifierMock.verify).not.toHaveBeenCalled();
      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(refreshTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(tokenHasherMock.hash).not.toHaveBeenCalled();
      expect(sessionRepositoryMock.refresh).not.toHaveBeenCalled();
    });

    it('debe lanzar InvalidSessionException cuando el refresh token no es válido', async () => {
      // Arrange
      const oldWrongRefreshToken = oldRefreshToken;

      sessionRepositoryMock.findActiveToUpdate.mockResolvedValue(session);

      tokenHasherMock.compare
        .mockReturnValueOnce(true)
        .mockReturnValueOnce(false);

      // Act
      const result = useCase.run(accountId, oldToken, oldWrongRefreshToken);

      // Assert
      await expect(result).rejects.toThrow(InvalidSessionException);

      expect(sessionRepositoryMock.findActiveToUpdate).toHaveBeenCalledWith(
        accountId,
      );
      expect(tokenHasherMock.compare).toHaveBeenCalledTimes(2);

      expect(accessTokenVerifierMock.verify).not.toHaveBeenCalled();
      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(refreshTokenGeneratorMock.generate).not.toHaveBeenCalled();
      expect(tokenHasherMock.hash).not.toHaveBeenCalled();
      expect(sessionRepositoryMock.refresh).not.toHaveBeenCalled();
    });

    it('debe retornar el nuevo token y refresh token cuando la sesión es válida', async () => {
      // Arrange
      const accessTokenPayload = {
        accountId,
        roleId: 'test-role-id',
        profileId: 'test-profile-id',
      };
      const newToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

      const newRefreshToken =
        '05e482780e544691306b834c4f0a9d52be31d22b0b7fcbbabdce6117300f9d1e8b3b8b6a0fa189714631dd0528bce4953b7f97cabeb0009c18f6bebfd6dac9ad';

      const expiresAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

      sessionRepositoryMock.findActiveToUpdate.mockResolvedValue(session);
      tokenHasherMock.compare.mockReturnValue(true);
      accessTokenGeneratorMock.generate.mockResolvedValue(newToken);
      refreshTokenGeneratorMock.generate.mockReturnValue(newRefreshToken);
      accessTokenVerifierMock.verify.mockResolvedValue(accessTokenPayload);
      tokenHasherMock.hash
        .mockReturnValueOnce('new-token-hash')
        .mockReturnValueOnce('new-refresh-token-hash');
      dateHandlerMock.addDays.mockReturnValue(expiresAt);

      // Act
      const result = await useCase.run(accountId, oldToken, oldRefreshToken);

      // Assert
      expect(result.token).toBe(newToken);
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).toHaveLength(128);

      expect(sessionRepositoryMock.findActiveToUpdate).toHaveBeenCalledWith(
        accountId,
      );

      expect(tokenHasherMock.compare).toHaveBeenCalledTimes(2);

      expect(accessTokenVerifierMock.verify).toHaveBeenCalledTimes(1);
      expect(accessTokenVerifierMock.verify).toHaveBeenCalledWith(oldToken);

      expect(accessTokenGeneratorMock.generate).toHaveBeenCalledTimes(1);
      expect(accessTokenGeneratorMock.generate).toHaveBeenCalledWith(
        accessTokenPayload,
      );

      expect(refreshTokenGeneratorMock.generate).toHaveBeenCalledTimes(1);

      expect(sessionRepositoryMock.refresh).toHaveBeenCalledWith(
        session.sessionId,
        {
          tokenHash: expect.any(String) as string,
          refreshTokenHash: expect.any(String) as string,
          lastActivityAt: expect.any(Date) as Date,
          expiresAt,
        },
      );
    });
  });
});
