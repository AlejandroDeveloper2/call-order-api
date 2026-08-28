/** Modelos de lectura */
import { SessionValidationModel } from '../../../domain/models';

/** Excepciones de dominio */
import { InvalidTokenException } from '../../../domain/exceptions';

/** Puertos */
import { SessionRepositoryPort, TokenHasherPort } from '../../../domain/ports';

/** Excepciones de aplicación */
import { InvalidSessionException } from '../../exceptions';

/** Casos de uso */
import { LogoutUseCase } from './logout.usecase';

type SessionRopositoryMock = Pick<
  SessionRepositoryPort,
  'revoke' | 'findActiveForValidation'
>;
type TokenHasherMock = Pick<TokenHasherPort, 'compare'>;

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;
  let sessionRepositoryMock: jest.Mocked<SessionRopositoryMock>;
  let tokenHasherMock: jest.Mocked<TokenHasherMock>;

  const accountId = 'test-account-id';
  const token =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

  beforeEach(() => {
    sessionRepositoryMock = {
      findActiveForValidation: jest.fn(),
      revoke: jest.fn(),
    };
    tokenHasherMock = {
      compare: jest.fn(),
    };

    useCase = new LogoutUseCase(
      sessionRepositoryMock as unknown as SessionRepositoryPort,
      tokenHasherMock as unknown as TokenHasherPort,
    );

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar InvalidTokenException si el token proporcionado no tiene un formato valido', async () => {
      // Arrange
      const invalidToken = 'token-1';

      // Act
      const result = useCase.run(accountId, invalidToken);

      // Assert
      await expect(result).rejects.toThrow(InvalidTokenException);

      expect(
        sessionRepositoryMock.findActiveForValidation,
      ).not.toHaveBeenCalled();
      expect(tokenHasherMock.compare).not.toHaveBeenCalled();
      expect(sessionRepositoryMock.revoke).not.toHaveBeenCalled();
    });

    it('deberia lanzar InvalidSessionException cuando no se encuentra ninguna sesión asociada al ID Proporcionado', async () => {
      // Arrange
      const wrongAccountId = 'wrong-account-id';

      sessionRepositoryMock.findActiveForValidation.mockResolvedValue(null);

      // Acts
      const result = useCase.run(wrongAccountId, token);

      // Assert
      await expect(result).rejects.toThrow(InvalidSessionException);

      expect(
        sessionRepositoryMock.findActiveForValidation,
      ).toHaveBeenCalledWith(wrongAccountId);

      expect(sessionRepositoryMock.revoke).not.toHaveBeenCalled();
      expect(tokenHasherMock.compare).not.toHaveBeenCalled();
    });

    it('deberia lanzar InvalidSessionException cuando el token no es valido', async () => {
      // Arrange
      const session: SessionValidationModel = {
        sessionId: 'test-session-id',
        tokenHash: 'stored-token-hash',
      };

      sessionRepositoryMock.findActiveForValidation.mockResolvedValue(session);

      tokenHasherMock.compare.mockReturnValue(false);

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).rejects.toThrow(InvalidSessionException);

      expect(
        sessionRepositoryMock.findActiveForValidation,
      ).toHaveBeenCalledWith(accountId);

      expect(tokenHasherMock.compare).toHaveBeenCalledWith(
        token,
        session.tokenHash,
      );

      expect(sessionRepositoryMock.revoke).not.toHaveBeenCalled();
    });

    it('deberia revocar la sesion actual cuando el token es valido', async () => {
      // Arrange
      const session: SessionValidationModel = {
        sessionId: 'test-session-id',
        tokenHash: 'stored-token-hash',
      };

      sessionRepositoryMock.findActiveForValidation.mockResolvedValue(session);

      tokenHasherMock.compare.mockReturnValue(true);

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).resolves.toBeUndefined();

      expect(
        sessionRepositoryMock.findActiveForValidation,
      ).toHaveBeenCalledWith(accountId);

      expect(sessionRepositoryMock.revoke).toHaveBeenCalledWith(
        session.sessionId,
      );
      expect(tokenHasherMock.compare).toHaveBeenCalledWith(
        token,
        session.tokenHash,
      );
    });
  });
});
