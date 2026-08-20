import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { addDays } from 'date-fns';

/** Entidades */
import { Session } from '../../../domain/entities';
/** Puertos */
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
} from '../../../domain/ports';
/** Tipos */
import { JwtPayload } from '../../../../shared/domain/types';
/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';
import { SHARED_ERROR_CODES } from '../../../../shared/domain/exceptions';

/** Caso de uso */
import { ValidateSessionUseCase } from './validate-session.usecase';

jest.mock('bcrypt');

describe('ValidateSessionUsecase', () => {
  let useCase: ValidateSessionUseCase;

  const jwtService = {
    verifyAsync: jest.fn(),
  } satisfies Pick<JwtService, 'verifyAsync'>;

  const sessionRepository = {
    findByAccountId: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'findByAccountId'>;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => Promise<boolean>
  >(bcrypt.compare);

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

  const payload: JwtPayload = {
    accountId: 'account-id',
    profileId: 'profile-id',
    roleId: 'role-id',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateSessionUseCase,
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

    useCase = module.get<ValidateSessionUseCase>(ValidateSessionUseCase);
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar AppError cuando el token no es válido', async () => {
      // Arrange
      const accountId = 'account-id';
      const token = 'invalid-token';

      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: SHARED_ERROR_CODES.invalidToken,
        httpCode: 401,
      });
    });

    it('debe lanzar un AppError cuando la sesión no es valida', async () => {
      // Arrange
      const accountId = 'wrong-account-id';
      const token = 'valid-token';

      jwtService.verifyAsync.mockResolvedValue(payload);

      sessionRepository.findByAccountId.mockResolvedValue([]);

      //bcryptCompareMock.mockResolvedValue(false);

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });
    });

    it('debe validar la sesión y retornar los datos del payload si es válida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const token = 'valid-token';

      jwtService.verifyAsync.mockResolvedValue(payload);

      sessionRepository.findByAccountId.mockResolvedValue([
        buildSession({
          accountId,
        }),
      ]);

      bcryptCompareMock.mockResolvedValue(true);

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
