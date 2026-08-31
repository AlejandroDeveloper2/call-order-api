/** Puertos */
import {
  DateHandlerPort,
  IdGeneratorPort,
  TransactionManagerPort,
} from '../../../../shared/domain/ports';

import {
  AccessTokenGeneratorPort,
  AccountRepositoryPort,
  RefreshTokenGeneratorPort,
  SessionRepositoryPort,
  TokenHasherPort,
  VerificationCodeLookupPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';

/** Modelos */
import { VerificationCodeValidationModel } from '../../../domain/models';

/** Commands */
import { ValidateIdentityCommand } from '../../commands';

/** Caso de uso */
import { ValidateIdentityUseCase } from './validate-identity.usecase';

/** Excepciones de aplicación */
import { ExpiredCodeException, InvalidCodeException } from '../../exceptions';

type AccountRepositoryMock = Pick<AccountRepositoryPort, 'updateLastLogin'>;
type VerificationCodeRepositoryMock = Pick<
  VerificationCodeRepositoryPort,
  'findForIdentityValidation' | 'markAsUsed'
>;
type SessionRepositoryMock = Pick<
  SessionRepositoryPort,
  'revokeByAccountId' | 'create'
>;
type TransactionManagerMock = Pick<TransactionManagerPort, 'run'>;
type IdGeneratorMock = Pick<IdGeneratorPort, 'generate'>;
type TokenHasherMock = Pick<TokenHasherPort, 'compare' | 'hash'>;
type AccessTokenGeneratorMock = Pick<AccessTokenGeneratorPort, 'generate'>;
type RefreshTokenGeneratorMock = Pick<RefreshTokenGeneratorPort, 'generate'>;
type VerificationCodeLookupMock = Pick<
  VerificationCodeLookupPort,
  'generateLookup'
>;
type DateHandlerMock = Pick<DateHandlerPort, 'isAfter' | 'addDays'>;

describe('ValidateIdentityUseCase', () => {
  let useCase: ValidateIdentityUseCase;
  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;
  let verificationCodeRepositoryMock: jest.Mocked<VerificationCodeRepositoryMock>;
  let sessionRepositoryMock: jest.Mocked<SessionRepositoryMock>;
  let transactionManagerMock: jest.Mocked<TransactionManagerMock>;
  let idGeneratorMock: jest.Mocked<IdGeneratorMock>;
  let tokenHasherMock: jest.Mocked<TokenHasherMock>;
  let accessTokenGeneratorMock: jest.Mocked<AccessTokenGeneratorMock>;
  let refreshTokenGeneratorMock: jest.Mocked<RefreshTokenGeneratorMock>;
  let verificationCodeLookupMock: jest.Mocked<VerificationCodeLookupMock>;
  let dateHandlerMock: jest.Mocked<DateHandlerMock>;

  const now = new Date('2026-08-30T15:00:00.000Z');

  const expiresAt = new Date('2026-08-30T16:00:00.000Z');

  const codeLookup = 'test-code-lookup';

  const accessToken =
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30';
  const refreshToken =
    '3de3bc8b981cfecb3116b1a643163886e011fbfd877aba391298b1f3a56c012f8b3bcfb55643a08372ddcd3d1ab0c939e83fc236360ec289f9444b6c0cc9a7d0';

  const command: ValidateIdentityCommand = {
    email: 'john.doe@example.com',
    verificationCode: '123456',
    browser: 'Chrome',
    operatingSystem: 'Windows',
    ipAddress: '127.0.0.1',
    userAgent: 'Mozilla/5.0',
    deviceName: 'My PC',
    deviceType: 'desktop',
  };

  const verificationCode: VerificationCodeValidationModel = {
    verificationCodeId: 'verification-code-id',
    codeHash: 'hashed-code',
    expiresAt,
    accountId: 'account-id',
    attempts: 0,
    profile: {
      profileId: 'profile-id',
      roleId: 'role-id',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(global, 'Date').mockImplementation(() => now);

    accountRepositoryMock = {
      updateLastLogin: jest.fn(),
    };

    verificationCodeRepositoryMock = {
      findForIdentityValidation: jest.fn(),
      markAsUsed: jest.fn(),
    };

    sessionRepositoryMock = {
      revokeByAccountId: jest.fn(),
      create: jest.fn(),
    };

    transactionManagerMock = {
      run: jest.fn(),
    };

    idGeneratorMock = {
      generate: jest.fn(),
    };

    tokenHasherMock = {
      hash: jest.fn(),
      compare: jest.fn(),
    };

    accessTokenGeneratorMock = {
      generate: jest.fn(),
    };

    refreshTokenGeneratorMock = {
      generate: jest.fn(),
    };

    verificationCodeLookupMock = {
      generateLookup: jest.fn(),
    };

    dateHandlerMock = {
      isAfter: jest.fn(),
      addDays: jest.fn(),
    };

    useCase = new ValidateIdentityUseCase(
      accountRepositoryMock as unknown as AccountRepositoryPort,
      verificationCodeRepositoryMock as unknown as VerificationCodeRepositoryPort,
      sessionRepositoryMock as unknown as SessionRepositoryPort,
      transactionManagerMock,
      idGeneratorMock,
      tokenHasherMock,
      accessTokenGeneratorMock,
      refreshTokenGeneratorMock,
      verificationCodeLookupMock,
      dateHandlerMock as unknown as DateHandlerPort,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('(run)', () => {
    it('deberia validar la identidad del usuario, crear la sesión y validar los tokens', async () => {
      //Arrange
      const tokenHash = 'hashed-access-token';
      const refreshTokenHash = 'hashed-refresh-token';

      const sessionId = 'session-id';

      const transactionContext = {
        queryRunner: 'query-runner',
      };

      const sessionExpiresAt = new Date('2026-08-31T15:00:00.000Z');

      verificationCodeLookupMock.generateLookup.mockReturnValue(codeLookup);

      verificationCodeRepositoryMock.findForIdentityValidation.mockResolvedValue(
        verificationCode,
      );

      tokenHasherMock.compare.mockReturnValue(true);

      dateHandlerMock.isAfter.mockReturnValue(false);

      accessTokenGeneratorMock.generate.mockResolvedValue(accessToken);

      refreshTokenGeneratorMock.generate.mockReturnValue(refreshToken);

      tokenHasherMock.hash
        .mockReturnValueOnce(tokenHash)
        .mockReturnValueOnce(refreshTokenHash);

      dateHandlerMock.addDays.mockReturnValue(sessionExpiresAt);

      idGeneratorMock.generate.mockReturnValue(sessionId);

      transactionManagerMock.run.mockImplementation(async (callback) =>
        callback(transactionContext),
      );

      // Act
      const result = await useCase.run(command);

      // Assert
      expect(result).toEqual({
        token: accessToken,
        refreshToken,
      });

      expect(verificationCodeLookupMock.generateLookup).toHaveBeenCalledWith(
        command.verificationCode,
      );

      expect(
        verificationCodeRepositoryMock.findForIdentityValidation,
      ).toHaveBeenCalledWith(command.email, codeLookup);

      expect(tokenHasherMock.compare).toHaveBeenCalledWith(
        command.verificationCode,
        verificationCode.codeHash,
      );

      expect(accessTokenGeneratorMock.generate).toHaveBeenCalledWith({
        accountId: verificationCode.accountId,
        roleId: verificationCode.profile.roleId,
        profileId: verificationCode.profile.profileId,
      });

      expect(refreshTokenGeneratorMock.generate).toHaveBeenCalledTimes(1);

      expect(tokenHasherMock.hash).toHaveBeenCalledTimes(2);

      expect(sessionRepositoryMock.revokeByAccountId).toHaveBeenCalledWith(
        verificationCode.accountId,
        now,
      );

      expect(transactionManagerMock.run).toHaveBeenCalledTimes(1);

      expect(sessionRepositoryMock.create).toHaveBeenCalledTimes(1);

      expect(verificationCodeRepositoryMock.markAsUsed).toHaveBeenCalledTimes(
        1,
      );

      expect(accountRepositoryMock.updateLastLogin).toHaveBeenCalledTimes(1);
    });

    it('deberia lanzar InvalidCodeException si el código de verificación no existe', async () => {
      // Arrange
      verificationCodeLookupMock.generateLookup.mockReturnValue(codeLookup);

      verificationCodeRepositoryMock.findForIdentityValidation.mockResolvedValue(
        null,
      );

      // Act
      const promise = useCase.run(command);

      // Assert
      await expect(promise).rejects.toBeInstanceOf(InvalidCodeException);

      expect(tokenHasherMock.compare).not.toHaveBeenCalled();

      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();

      expect(sessionRepositoryMock.revokeByAccountId).not.toHaveBeenCalled();

      expect(transactionManagerMock.run).not.toHaveBeenCalled();
    });

    it('deberia lanzar InvalidCodeException cuando el hash del código de verificación es invalido', async () => {
      // Arrange
      verificationCodeLookupMock.generateLookup.mockReturnValue(codeLookup);

      verificationCodeRepositoryMock.findForIdentityValidation.mockResolvedValue(
        verificationCode,
      );

      tokenHasherMock.compare.mockReturnValue(false);

      // Act
      const promise = useCase.run(command);

      // Assert
      await expect(promise).rejects.toBeInstanceOf(InvalidCodeException);

      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();

      expect(refreshTokenGeneratorMock.generate).not.toHaveBeenCalled();

      expect(sessionRepositoryMock.revokeByAccountId).not.toHaveBeenCalled();

      expect(transactionManagerMock.run).not.toHaveBeenCalled();
    });

    it('deberia lanzar ExpiredCodeException si el código de verificación ha expirado', async () => {
      // Arrange
      verificationCodeLookupMock.generateLookup.mockReturnValue(codeLookup);

      verificationCodeRepositoryMock.findForIdentityValidation.mockResolvedValue(
        verificationCode,
      );

      tokenHasherMock.compare.mockReturnValue(true);

      dateHandlerMock.isAfter.mockReturnValue(true);

      //Act
      const promise = useCase.run(command);

      //Assert
      await expect(promise).rejects.toBeInstanceOf(ExpiredCodeException);

      expect(accessTokenGeneratorMock.generate).not.toHaveBeenCalled();

      expect(refreshTokenGeneratorMock.generate).not.toHaveBeenCalled();

      expect(sessionRepositoryMock.revokeByAccountId).not.toHaveBeenCalled();

      expect(transactionManagerMock.run).not.toHaveBeenCalled();
    });

    it('deberia usar los valores por defecto cuando se crea una sesión, si los metadatos opcionales de la sesión son omitidos', async () => {
      // Arrange
      const commandWithoutMetadata: ValidateIdentityCommand = {
        email: command.email,
        verificationCode: command.verificationCode,
      };

      verificationCodeLookupMock.generateLookup.mockReturnValue(codeLookup);

      verificationCodeRepositoryMock.findForIdentityValidation.mockResolvedValue(
        verificationCode,
      );

      tokenHasherMock.compare.mockReturnValue(true);

      dateHandlerMock.isAfter.mockReturnValue(false);

      accessTokenGeneratorMock.generate.mockResolvedValue(accessToken);

      refreshTokenGeneratorMock.generate.mockReturnValue(refreshToken);

      tokenHasherMock.hash
        .mockReturnValueOnce('token-hash')
        .mockReturnValueOnce('refresh-token-hash');

      dateHandlerMock.addDays.mockReturnValue(
        new Date('2026-08-31T15:00:00.000Z'),
      );

      idGeneratorMock.generate.mockReturnValue('session-id');

      transactionManagerMock.run.mockImplementation(async (callback) =>
        callback({}),
      );

      //Act
      await useCase.run(commandWithoutMetadata);

      // Assert

      const [session] = sessionRepositoryMock.create.mock.calls[0];

      expect(session).toBeDefined();

      expect(session.getBrowser).toBe('unknown');

      expect(session.getOperatingSystem).toBe('unknown');

      expect(session.getIpAddress).toBe('0.0.0.0');

      expect(session.getUserAgent).toBe('');
    });

    it('deberia usar el mismo contexto transaccional para todas las operaciones de persistencia, cuando la transacción es ejecutada', async () => {
      // Arrange
      verificationCodeLookupMock.generateLookup.mockReturnValue(codeLookup);

      verificationCodeRepositoryMock.findForIdentityValidation.mockResolvedValue(
        verificationCode,
      );

      tokenHasherMock.compare.mockReturnValue(true);

      dateHandlerMock.isAfter.mockReturnValue(false);

      accessTokenGeneratorMock.generate.mockResolvedValue(accessToken);

      refreshTokenGeneratorMock.generate.mockReturnValue(refreshToken);

      tokenHasherMock.hash
        .mockReturnValueOnce('token-hash')
        .mockReturnValueOnce('refresh-token-hash');

      dateHandlerMock.addDays.mockReturnValue(
        new Date('2026-08-31T15:00:00.000Z'),
      );

      idGeneratorMock.generate.mockReturnValue('session-id');

      const transactionContext = {
        id: 'transaction-context',
      };

      transactionManagerMock.run.mockImplementation(async (callback) =>
        callback(transactionContext),
      );

      // Act
      await useCase.run(command);

      // Assert
      expect(sessionRepositoryMock.create).toHaveBeenCalledWith(
        expect.anything(),
        transactionContext,
      );

      expect(verificationCodeRepositoryMock.markAsUsed).toHaveBeenCalledWith(
        verificationCode.verificationCodeId,
        now,
        transactionContext,
      );

      expect(accountRepositoryMock.updateLastLogin).toHaveBeenCalledWith(
        verificationCode.accountId,
        now,
        transactionContext,
      );
    });
  });
});
