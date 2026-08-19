import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { addMinutes } from 'date-fns';

/** Entidades */
import { VerificationCode } from '../../../domain/entities';

/** Ports */
import {
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import {
  EMAIL_SENDER_KEY,
  EmailSenderPort,
} from '../../../../shared/domain/ports';

/** Exceptions */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** DTO */
import { ResendCodeDto } from '../../dto';

/** Use case */
import { ResendCodeUseCase } from './resend-code.usecase';

/** Utils */
import { generateVerificationCode } from '../../../domain/utils/generate-validation-code';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../../domain/utils/generate-validation-code', () => ({
  generateVerificationCode: jest.fn(),
}));

describe('ResendCodeUseCase', () => {
  let useCase: ResendCodeUseCase;

  const verificationCodeRepository = {
    findByAccountId: jest.fn(),
    update: jest.fn(),
  } satisfies Pick<
    VerificationCodeRepositoryPort,
    'findByAccountId' | 'update'
  >;

  const emailSender = {
    sendEmail: jest.fn(),
  } satisfies Pick<EmailSenderPort, 'sendEmail'>;

  const dto: ResendCodeDto = {
    accountId: 'account-1',
    email: 'test@gmail.com',
    expiredCode: '123456',
  };

  const buildVerificationCode = (
    overrides: Partial<VerificationCode> = {},
  ): VerificationCode => {
    const verificationCode = new VerificationCode(
      'verification-code-id',
      dto.accountId,
      'code-hash',
      'double-factor',
      addMinutes(new Date(), 10),
      0,
    );

    Object.assign(verificationCode, overrides);

    return verificationCode;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendCodeUseCase,
        {
          provide: VERIFICATION_CODE_REPOSITORY,
          useValue: verificationCodeRepository,
        },
        {
          provide: EMAIL_SENDER_KEY,
          useValue: emailSender,
        },
      ],
    }).compile();

    useCase = module.get(ResendCodeUseCase);
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el código ingresado no es válido', async () => {
      const wrongVerificationCode = buildVerificationCode({
        codeHash: 'wrong-code-hash',
      });

      verificationCodeRepository.findByAccountId.mockResolvedValue([
        wrongVerificationCode,
      ]);

      jest
        .mocked<(data: string | Buffer, encrypted: string) => Promise<boolean>>(
          bcrypt.compare,
        )
        .mockResolvedValue(false);

      await expect(useCase.run(dto)).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidCode,
        httpCode: 401,
      });

      expect(verificationCodeRepository.findByAccountId).toHaveBeenCalledWith(
        dto.accountId,
      );

      expect(verificationCodeRepository.update).not.toHaveBeenCalled();

      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el código aun no ha expirado', async () => {
      const verificationCode = buildVerificationCode();

      verificationCodeRepository.findByAccountId.mockResolvedValue([
        verificationCode,
      ]);
      jest
        .mocked<(data: string | Buffer, encrypted: string) => Promise<boolean>>(
          bcrypt.compare,
        )
        .mockResolvedValue(true);

      await expect(useCase.run(dto)).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.codeNotExpiredYet,
        httpCode: 400,
      });

      expect(verificationCodeRepository.findByAccountId).toHaveBeenCalledWith(
        dto.accountId,
      );

      expect(verificationCodeRepository.update).not.toHaveBeenCalled();

      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe generar y actualizar un nuevo código cuando el código ingresado es válido y ya ha expirado', async () => {
      const verificationCode = buildVerificationCode({
        expiresAt: addMinutes(new Date(), -5),
      });

      verificationCodeRepository.findByAccountId.mockResolvedValue([
        verificationCode,
      ]);

      jest
        .mocked<(data: string | Buffer, encrypted: string) => Promise<boolean>>(
          bcrypt.compare,
        )
        .mockResolvedValue(true);
      jest
        .mocked<
          (
            data: string | Buffer,
            saltOrRounds: string | number,
          ) => Promise<string>
        >(bcrypt.hash)
        .mockResolvedValue('new-hashed-code');
      jest.mocked(generateVerificationCode).mockReturnValue('654321');

      verificationCodeRepository.update.mockResolvedValue(1);
      emailSender.sendEmail.mockResolvedValue(undefined);

      await expect(useCase.run(dto)).resolves.toBeUndefined();

      expect(verificationCodeRepository.findByAccountId).toHaveBeenCalledWith(
        dto.accountId,
      );

      expect(generateVerificationCode).toHaveBeenCalledTimes(1);

      expect(bcrypt.hash).toHaveBeenCalledWith('654321', 10);

      expect(verificationCodeRepository.update).toHaveBeenCalledTimes(1);

      expect(verificationCodeRepository.update).toHaveBeenCalledWith(
        verificationCode.verificationCodeId,
        expect.objectContaining({
          attempts: verificationCode.attempts + 1,
          codeHash: 'new-hashed-code',
          expiresAt: expect.any(Date) as Date,
        }),
      );

      expect(emailSender.sendEmail).toHaveBeenCalledTimes(1);

      expect(emailSender.sendEmail).toHaveBeenCalledWith(
        dto.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('654321'),
      );
    });
  });
});
