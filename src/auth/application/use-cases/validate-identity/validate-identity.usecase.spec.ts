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
/** Errores de dominio */
import { AppError } from '../../../../shared/domain/exceptions';

/** Casos de uso */
import { ValidateIdentityUseCase } from './validate-identity.usecase';
/** Dtos */
import { ValidateIdentityDto } from '../../dto';

jest.mock('uuid', () => ({
  v4: () => 'test-session-id',
}));

describe('ValidateIdentity', () => {
  let useCase: ValidateIdentityUseCase;

  const verificationCodeRepository = {
    findByAccountId: jest.fn(),
    invalidateCode: jest.fn(),
  } satisfies Pick<
    VerificationCodeRepositoryPort,
    'invalidateCode' | 'findByAccountId'
  >;

  const sessionRepository = {
    revokeByAccountId: jest.fn(),
    create: jest.fn(),
  } satisfies Pick<SessionRepositoryPort, 'revokeByAccountId' | 'create'>;

  const buildVerificationCode = (overrides: Partial<VerificationCode> = {}) => {
    const code = new VerificationCode(
      'test-code-id',
      'test-account-id',
      bcrypt.hashSync('123456', 10),
      'double-factor',
      addMinutes(new Date(), 10),
      0,
    );
    Object.assign(code, overrides);
    return code;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: JwtService,
          useValue: { sign: jest.fn().mockReturnValue('signed-token') },
        },
        ValidateIdentityUseCase,
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

    useCase = module.get(ValidateIdentityUseCase);
    verificationCodeRepository.findByAccountId.mockReset();
    verificationCodeRepository.invalidateCode.mockReset();
    sessionRepository.create.mockReset();
    sessionRepository.revokeByAccountId.mockReset();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar un error cuando el código de verificación no es encontrado', async () => {
      const dto: ValidateIdentityDto = {
        verificationCode: '123456',
        accountId: 'test-account-id',
      };

      verificationCodeRepository.findByAccountId.mockResolvedValue([]);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);

      const error = (await useCase
        .run(dto)
        .catch((err: AppError) => err)) as AppError;
      expect(error).toBeInstanceOf(AppError);
      expect(error.name).toBe('CODE_NOT_FOUND');
      expect(error.httpCode).toBe(404);
      expect(verificationCodeRepository.findByAccountId).toHaveBeenCalledWith(
        dto.accountId,
      );
      expect(sessionRepository.revokeByAccountId).not.toHaveBeenCalled();
      expect(sessionRepository.create).not.toHaveBeenCalled();
      expect(verificationCodeRepository.invalidateCode).not.toHaveBeenCalled();
    });

    it('debe lanzar un error cuando el código ingresado no coincide con ninguno', async () => {
      const dto: ValidateIdentityDto = {
        verificationCode: '123456',
        accountId: 'test-account-id',
      };

      // Repository returns a code but with a different hash
      const wrongHashCode = new VerificationCode(
        'wrong-code-id',
        dto.accountId,
        bcrypt.hashSync('000000', 10),
        'double-factor',
        addMinutes(new Date(), 10),
        0,
      );

      verificationCodeRepository.findByAccountId.mockResolvedValue([
        wrongHashCode,
      ]);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);
      const error = (await useCase
        .run(dto)
        .catch((e: AppError) => e)) as AppError;
      expect(error.name).toBe('CODE_NOT_FOUND');
      expect(verificationCodeRepository.findByAccountId).toHaveBeenCalledWith(
        dto.accountId,
      );
    });

    it('debe lanzar un error cuando el código ha expirado', async () => {
      const dto: ValidateIdentityDto = {
        verificationCode: '123456',
        accountId: 'test-account-id',
      };

      const expiredCode = buildVerificationCode({
        expiresAt: addMinutes(new Date(), -5),
      });
      verificationCodeRepository.findByAccountId.mockResolvedValue([
        expiredCode,
      ]);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);
      const error = (await useCase
        .run(dto)
        .catch((err: AppError) => err)) as AppError;
      expect(error.name).toBe('EXPIRED_CODE');
      expect(error.httpCode).toBe(401);
    });

    it('debe crear sesión nueva y devolver tokens en caso exitoso', async () => {
      const dto: ValidateIdentityDto = {
        verificationCode: '123456',
        accountId: 'test-account-id',
        browser: 'Chrome',
        operatingSystem: 'Windows',
        ipAddress: '127.0.0.1',
        userAgent: 'agent',
        deviceName: 'PC',
        deviceType: 'desktop',
      };

      const validCode = buildVerificationCode({
        verificationCodeId: 'test-code-id',
        accountId: dto.accountId,
        expiresAt: addMinutes(new Date(), 10),
      });

      verificationCodeRepository.findByAccountId.mockResolvedValue([validCode]);
      sessionRepository.revokeByAccountId.mockResolvedValue(1);
      sessionRepository.create.mockResolvedValue(undefined);
      verificationCodeRepository.invalidateCode.mockResolvedValue(undefined);

      const result = await useCase.run(dto);

      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('refreshToken');
      expect(sessionRepository.revokeByAccountId).toHaveBeenCalledWith(
        dto.accountId,
        expect.any(Date),
      );
      expect(sessionRepository.create).toHaveBeenCalled();

      expect(verificationCodeRepository.invalidateCode).toHaveBeenCalledWith(
        validCode.verificationCodeId,
        expect.any(Date),
      );
    });
  });
});
