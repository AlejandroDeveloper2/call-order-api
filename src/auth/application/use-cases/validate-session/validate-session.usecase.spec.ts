import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  AccountRepositoryPort,
  ACCOUNT_REPOSITORY,
} from '../../../domain/ports';

/** Tipos */
import { JwtPayload } from '../../../../shared/domain/types';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';
import { SHARED_ERROR_CODES } from '../../../../shared/domain/exceptions';

/** Caso de uso */
import { ValidateSessionUseCase } from './validate-session.usecase';

/** utilidades */
import {
  buildAccount,
  buildSession,
} from '../../../../shared/application/utils/domain-class-contructor';

jest.mock('bcrypt');

describe('ValidateSessionUsecase', () => {
  let useCase: ValidateSessionUseCase;

  const jwtService = {
    verifyAsync: jest.fn(),
  } satisfies Pick<JwtService, 'verifyAsync'>;

  const accountRepository = {
    findById: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'findById'>;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => boolean
  >(bcrypt.compareSync);

  const payload: JwtPayload = {
    accountId: 'test-account-id',
    profileId: 'test-profile-id',
    roleId: 'test-role-id',
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
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
      ],
    }).compile();

    useCase = module.get<ValidateSessionUseCase>(ValidateSessionUseCase);
    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar AppError cuando el token no es válido', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const token = 'invalid-token';

      jwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: SHARED_ERROR_CODES.invalidToken,
        httpCode: 401,
      });

      expect(accountRepository.findById).not.toHaveBeenCalled();
      expect(bcryptCompareMock).not.toHaveBeenCalled();
    });

    it('debe lanzar un AppError cuando la sesión no es valida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const session = buildSession();
      const account = buildAccount({ sessions: [session] });

      const token = 'wrong-token';

      jwtService.verifyAsync.mockResolvedValue(payload);

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(false);

      // Act
      const result = useCase.run(accountId, token);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidSession,
        httpCode: 401,
      });

      expect(bcryptCompareMock).toHaveBeenCalledWith(token, session.tokenHash);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith(token, {
        ignoreExpiration: true,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);
    });

    it('debe validar la sesión y retornar los datos del payload si es válida', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const token = 'valid-token';
      const session = buildSession();
      const account = buildAccount({ sessions: [session] });

      jwtService.verifyAsync.mockResolvedValue(payload);

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(true);

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
