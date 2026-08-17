import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { addMinutes } from 'date-fns';

/** Entidades de dominio */
import { VerificationCode } from '../../../domain/entities';

/** Puertos */
import {
  SESSION_REPOSITORY,
  SessionRepositoryPort,
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';

/** Errores */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Caso de uso */
import { ValidateIdentityUseCase } from './validate-identity.usecase';

/** DTO */
import { ValidateIdentityDto } from '../../dto';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-session-id'),
}));

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('ValidateIdentityUseCase', () => {
  let useCase: ValidateIdentityUseCase;

  const jwtService = {
    sign: jest.fn(),
  } satisfies Pick<JwtService, 'sign'>;

  const verificationCodeRepository = {
    findByAccountId: jest.fn(),
    invalidateCode: jest.fn(),
  } satisfies Pick<
    VerificationCodeRepositoryPort,
    'findByAccountId' | 'invalidateCode'
  >;

  const sessionRepository = {
    revokeByAccountId: jest.fn(),
    create: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'revokeByAccountId' | 'create'>;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => Promise<boolean>
  >(bcrypt.compare);
  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  const buildDto = (
    overrides: Partial<ValidateIdentityDto> = {},
  ): ValidateIdentityDto => ({
    accountId: 'account-id',
    verificationCode: '123456',
    ...overrides,
  });

  const buildVerificationCode = (
    overrides: Partial<VerificationCode> = {},
  ): VerificationCode => {
    const verificationCode = new VerificationCode(
      'verification-code-id',
      'account-id',
      'code-hash',
      'double-factor',
      addMinutes(new Date(), 10),
      0,
    );

    Object.assign(verificationCode, overrides);

    return verificationCode;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateIdentityUseCase,
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: VERIFICATION_CODE_REPOSITORY,
          useValue: verificationCodeRepository,
        },
        {
          provide: SESSION_REPOSITORY,
          useValue: sessionRepository,
        },
      ],
    }).compile();

    useCase = module.get<ValidateIdentityUseCase>(ValidateIdentityUseCase);

    jest.clearAllMocks();
  });

  describe('run', () => {
    it('debe lanzar AppError cuando el código ingresado no es válido', async () => {
      // Arrange
      const dto = buildDto();

      const verificationCode = buildVerificationCode();

      verificationCodeRepository.findByAccountId.mockResolvedValue([
        verificationCode,
      ]);

      bcryptCompareMock.mockResolvedValue(false);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidCode,
        httpCode: 401,
      });

      expect(verificationCodeRepository.findByAccountId).toHaveBeenCalledWith(
        dto.accountId,
      );

      expect(sessionRepository.revokeByAccountId).not.toHaveBeenCalled();
      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(verificationCodeRepository.invalidateCode).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el código ha expirado', async () => {
      // Arrange
      const dto = buildDto();

      const expiredVerificationCode = buildVerificationCode({
        expiresAt: addMinutes(new Date(), -5),
      });

      verificationCodeRepository.findByAccountId.mockResolvedValue([
        expiredVerificationCode,
      ]);

      bcryptCompareMock.mockResolvedValue(true);

      // Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.expiredCode,
        httpCode: 401,
      });

      expect(sessionRepository.revokeByAccountId).not.toHaveBeenCalled();
      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(verificationCodeRepository.invalidateCode).not.toHaveBeenCalled();
    });

    it('debe crear una nueva sesión, invalidar el código y retornar los tokens cuando la identidad es válida', async () => {
      // Arrange
      const dto = buildDto({
        browser: 'Chrome',
        operatingSystem: 'Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        deviceName: 'PC',
        deviceType: 'desktop',
      });

      const validVerificationCode = buildVerificationCode({
        verificationCodeId: 'verification-code-id',
        accountId: dto.accountId,
      });

      verificationCodeRepository.findByAccountId.mockResolvedValue([
        validVerificationCode,
      ]);

      bcryptCompareMock.mockResolvedValue(true);

      jwtService.sign.mockReturnValue('access-token');

      bcryptHashMock
        .mockResolvedValueOnce('access-token-hash')
        .mockResolvedValueOnce('refresh-token-hash');

      sessionRepository.revokeByAccountId.mockResolvedValue(undefined);
      sessionRepository.create.mockResolvedValue(undefined);
      verificationCodeRepository.invalidateCode.mockResolvedValue(undefined);

      // Act
      const result = await useCase.run(dto);

      // Assert
      expect(result.token).toBe('access-token');
      expect(result.refreshToken).toEqual(expect.any(String));
      expect(result.refreshToken).toHaveLength(128);

      expect(jwtService.sign).toHaveBeenCalledTimes(1);

      expect(jwtService.sign).toHaveBeenCalledWith({
        accountId: validVerificationCode.accountId,
        roleId: undefined,
        profileId: undefined,
      });

      expect(bcrypt.hash).toHaveBeenCalledTimes(2);

      expect(sessionRepository.revokeByAccountId).toHaveBeenCalledWith(
        dto.accountId,
        expect.any(Date),
      );

      expect(sessionRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          sessionId: 'test-session-id',
          accountId: dto.accountId,
          tokenHash: 'access-token-hash',
          refreshTokenHash: 'refresh-token-hash',
          browser: dto.browser,
          operatingSystem: dto.operatingSystem,
          ipAddress: dto.ipAddress,
          userAgent: dto.userAgent,
          deviceName: dto.deviceName,
          deviceType: dto.deviceType,
        }),
      );

      expect(verificationCodeRepository.invalidateCode).toHaveBeenCalledWith(
        validVerificationCode.verificationCodeId,
        expect.any(Date),
      );
    });
  });
});
