/** Puertos */
import {
  SessionRepositoryPort,
  TokenHasherPort,
  AccessTokenVerifierPort,
} from '../../../domain/ports';

/** Modelos */
import { SessionValidationModel } from '../../../domain/models';

/** Tipos */
import type { AccessTokenPayload } from '../../../domain/types';

/** Excepciones de aplicación */
import { InvalidSessionException } from '../../exceptions';

/** Caso de uso */
import { ValidateSessionUseCase } from './validate-session.usecase';

type SessionRepositoryMock = Pick<
  SessionRepositoryPort,
  'findActiveForValidation'
>;
type TokenHasherMock = Pick<TokenHasherPort, 'compare'>;
type AccessTokenVerifierMock = Pick<AccessTokenVerifierPort, 'verify'>;

describe('ValidateSessionUsecase', () => {
  let useCase: ValidateSessionUseCase;
  let sessionRepositoryMock: jest.Mocked<SessionRepositoryMock>;
  let tokenHasherMock: jest.Mocked<TokenHasherMock>;
  let accessTokenVerifierMock: jest.Mocked<AccessTokenVerifierMock>;

  const payload: AccessTokenPayload = {
    accountId: 'test-account-id',
    profileId: 'test-profile-id',
    roleId: 'test-role-id',
  };

  const session: SessionValidationModel = {
    sessionId: 'test-session-id',
    tokenHash: 'test-token-hash',
  };

  beforeEach(() => {
    sessionRepositoryMock = {
      findActiveForValidation: jest.fn(),
    };

    tokenHasherMock = {
      compare: jest.fn(),
    };

    accessTokenVerifierMock = {
      verify: jest.fn(),
    };

    useCase = new ValidateSessionUseCase(
      sessionRepositoryMock as unknown as SessionRepositoryPort,
      tokenHasherMock as unknown as TokenHasherPort,
      accessTokenVerifierMock,
    );

    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar InvalidSessionException cuando el token no es válido', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const token = 'invalid-token';

      accessTokenVerifierMock.verify.mockRejectedValue(
        new Error('Invalid token'),
      );

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).rejects.toThrow(InvalidSessionException);

      expect(
        sessionRepositoryMock.findActiveForValidation,
      ).not.toHaveBeenCalled();
      expect(tokenHasherMock.compare).not.toHaveBeenCalled();
    });

    it('debe lanzar un InvalidSessionException cuando la sesión no es valida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

      accessTokenVerifierMock.verify.mockResolvedValue(payload);

      sessionRepositoryMock.findActiveForValidation.mockResolvedValue(session);

      tokenHasherMock.compare.mockReturnValue(false);

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).rejects.toThrow(InvalidSessionException);

      expect(tokenHasherMock.compare).toHaveBeenCalledWith(
        token,
        session.tokenHash,
      );

      expect(accessTokenVerifierMock.verify).toHaveBeenCalledWith(token);

      expect(
        sessionRepositoryMock.findActiveForValidation,
      ).toHaveBeenCalledWith(accountId);
    });

    it('debe validar la sesión y retornar los datos del payload si es válida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const token =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';

      accessTokenVerifierMock.verify.mockResolvedValue(payload);

      sessionRepositoryMock.findActiveForValidation.mockResolvedValue(session);

      tokenHasherMock.compare.mockReturnValue(true);

      // Act
      const result = await useCase.run(accountId, token);

      // Assert
      expect(result).toEqual({
        token,
        ...payload,
      });
    });
  });
});
