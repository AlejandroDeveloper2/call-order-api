import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  SessionRepositoryPort,
  SESSION_REPOSITORY,
  AccountRepositoryPort,
  ACCOUNT_REPOSITORY,
} from '../../../domain/ports';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Casos de uso */
import { LogoutUseCase } from './logout.usecase';

/** Utilidades */
import {
  buildAccount,
  buildSession,
} from '../../../../shared/application/utils/domain-class-contructor';

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
}));

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;

  const mockAccountRepository = {
    findById: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'findById'>;

  const mockSessionRepository = {
    update: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'update'>;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => boolean
  >(bcrypt.compareSync);

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        {
          provide: SESSION_REPOSITORY,
          useValue: mockSessionRepository,
        },
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: mockAccountRepository,
        },
      ],
    }).compile();

    useCase = module.get(LogoutUseCase);
  });

  describe('run()', () => {
    it('debe lanzar error cuando no se encuentra ninguna cuenta asociada al ID Proporcionado', async () => {
      // Arrange
      mockAccountRepository.findById.mockResolvedValue(null);

      // Act
      const result = useCase.run('wrong-account-id', 'test-token');

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountNotFound,
        httpCode: 404,
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'wrong-account-id',
      );
      expect(mockSessionRepository.update).not.toHaveBeenCalled();
      expect(bcryptCompareMock).not.toHaveBeenCalled();
    });

    it('debe lanzar error cuando el token no es valido', async () => {
      // Arrange
      const session = buildSession();
      const account = buildAccount({ sessions: [session] });

      mockAccountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(false);

      // Act
      const result = useCase.run('test-account-id', 'wrong-token');

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'test-account-id',
      );
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        'wrong-token',
        'test-token-hash',
      );
      expect(mockSessionRepository.update).not.toHaveBeenCalled();
    });

    it('debe revocar la sesion actual cuando el token es valido', async () => {
      // Arrange
      const session = buildSession();
      const account = buildAccount({ sessions: [session] });

      mockAccountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(true);

      // Act
      const result = useCase.run('test-account-id', 'test-token');

      // Assert
      await expect(result).resolves.toBeUndefined();
      expect(mockAccountRepository.findById).toHaveBeenCalledWith(
        'test-account-id',
      );
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        'test-session-id',
        {
          revokedAt: expect.any(Date) as Date,
        },
      );
      expect(bcryptCompareMock).toHaveBeenCalledWith(
        'test-token',
        'test-token-hash',
      );
    });
  });
});
