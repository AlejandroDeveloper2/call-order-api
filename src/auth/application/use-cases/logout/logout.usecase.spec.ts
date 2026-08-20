import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { addDays } from 'date-fns';

/** Entidades */
import { Session } from '../../../domain/entities';

/** Puertos */
import {
  SessionRepositoryPort,
  SESSION_REPOSITORY,
} from '../../../domain/ports';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Casos de uso */
import { LogoutUseCase } from './logout.usecase';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('LogoutUseCase', () => {
  let useCase: LogoutUseCase;

  const mockSessionRepository = {
    findByAccountId: jest.fn(),
    update: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'findByAccountId' | 'update'>;

  const buildSession = (overrides: Partial<Session> = {}): Session => {
    const session = new Session(
      'session-test-id',
      'account-test-id',
      'token-hash-test',
      'refresh-token-hash-test',
      addDays(new Date(), 1),
      new Date(),
      'Chrome',
      'Windows',
      '127.0.0.1',
      'Mozilla/5.0',
      undefined,
      'desktop',
      'PC',
    );

    Object.assign(session, overrides);

    return session;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutUseCase,
        {
          provide: SESSION_REPOSITORY,
          useValue: mockSessionRepository,
        },
      ],
    }).compile();

    useCase = module.get(LogoutUseCase);
  });

  describe('run()', () => {
    it('debe lanzar error cuando el token no es valido', async () => {
      // Arrange
      const sessions = [buildSession()];
      mockSessionRepository.findByAccountId.mockResolvedValue(sessions);
      jest
        .mocked<(data: string | Buffer, encrypted: string) => Promise<boolean>>(
          bcrypt.compare,
        )
        .mockResolvedValue(false);

      // Act
      const result = useCase.run('account-test-id', 'wrong-token');

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });
      expect(mockSessionRepository.findByAccountId).toHaveBeenCalledWith(
        'account-test-id',
      );
      expect(mockSessionRepository.update).not.toHaveBeenCalled();
      expect(jest.mocked(bcrypt.compare)).toHaveBeenCalledWith(
        'wrong-token',
        'token-hash-test',
      );
    });

    it('debe revocar la sesion actual cuando el token es valido', async () => {
      // Arrange
      const sessions = [buildSession()];
      mockSessionRepository.findByAccountId.mockResolvedValue(sessions);
      jest
        .mocked<(data: string | Buffer, encrypted: string) => Promise<boolean>>(
          bcrypt.compare,
        )
        .mockResolvedValue(true);

      // Act
      const result = useCase.run('account-test-id', 'token-test');

      // Assert
      await expect(result).resolves.toBeUndefined();
      expect(mockSessionRepository.findByAccountId).toHaveBeenCalledWith(
        'account-test-id',
      );
      expect(mockSessionRepository.update).toHaveBeenCalledWith(
        'session-test-id',
        {
          revokedAt: expect.any(Date) as Date,
        },
      );
      expect(jest.mocked(bcrypt.compare)).toHaveBeenCalledWith(
        'token-test',
        'token-hash-test',
      );
    });

    it('debe lanzar error cuando no existen sesiones asociadas a la cuenta', async () => {
      // Arrange
      mockSessionRepository.findByAccountId.mockResolvedValue([]);

      // Act
      const result = useCase.run('account-test-id', 'token-test');

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });
      expect(mockSessionRepository.findByAccountId).toHaveBeenCalledWith(
        'account-test-id',
      );
      expect(mockSessionRepository.update).not.toHaveBeenCalled();
      expect(jest.mocked(bcrypt.compare)).not.toHaveBeenCalled();
    });
  });
});
