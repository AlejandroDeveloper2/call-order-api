import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { addMinutes } from 'date-fns';

/** Ports */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
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
import { ResendCodeDto } from '../../../infrastructure/dto';

/** Use case */
import { ResendCodeUseCase } from './resend-code.usecase';

/** Utils */
import { generateVerificationCode } from '../../../domain/utils/generate-validation-code';
import {
  buildAccount,
  buildVerificationCode,
} from '../../../../shared/application/utils/domain-class-contructor';

jest.mock('bcrypt', () => ({
  compareSync: jest.fn(),
  hash: jest.fn(),
}));

jest.mock('../../../domain/utils/generate-validation-code', () => ({
  generateVerificationCode: jest.fn(),
}));

describe('ResendCodeUseCase', () => {
  let useCase: ResendCodeUseCase;

  const accountRepository = {
    findById: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'findById'>;

  const verificationCodeRepository = {
    update: jest.fn(),
  } satisfies Pick<VerificationCodeRepositoryPort, 'update'>;

  const emailSender = {
    sendEmail: jest.fn(),
  } satisfies Pick<EmailSenderPort, 'sendEmail'>;

  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => boolean
  >(bcrypt.compareSync);

  const dto: ResendCodeDto = {
    accountId: 'test-account-id',
    email: 'test@gmail.com',
    expiredCode: '123456',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ResendCodeUseCase,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
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
    it('debe lanzar AppError cuando la cuenta no exista', async () => {
      // Arrange
      accountRepository.findById.mockResolvedValue(null);

      // Act
      const result = useCase.run({ ...dto, accountId: 'wrong-account-id' });

      //Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountNotFound,
        httpCode: 404,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(
        'wrong-account-id',
      );

      expect(bcryptCompareMock).not.toHaveBeenCalled();

      expect(verificationCodeRepository.update).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();

      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el código ingresado no es válido', async () => {
      // Arrange
      const account = buildAccount();

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(false);

      // Act
      const result = useCase.run(dto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.invalidCode,
        httpCode: 401,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(dto.accountId);

      expect(verificationCodeRepository.update).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();

      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el código aun no ha expirado', async () => {
      // Arrange
      const verificationCode = buildVerificationCode();
      const account = buildAccount({ verificationCodes: [verificationCode] });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(true);

      //Act
      const result = useCase.run(dto);

      // Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.codeNotExpiredYet,
        httpCode: 400,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(dto.accountId);

      expect(verificationCodeRepository.update).not.toHaveBeenCalled();

      expect(bcryptHashMock).not.toHaveBeenCalled();

      expect(emailSender.sendEmail).not.toHaveBeenCalled();
    });

    it('debe generar y actualizar un nuevo código cuando el código ingresado es válido y ya ha expirado', async () => {
      //Arrange
      const verificationCode = buildVerificationCode({
        expiresAt: addMinutes(new Date(), -5),
      });
      const account = buildAccount({ verificationCodes: [verificationCode] });

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockReturnValue(true);

      bcryptHashMock.mockResolvedValue('new-hashed-code');

      jest.mocked(generateVerificationCode).mockReturnValue('654321');

      verificationCodeRepository.update.mockResolvedValue(1);
      emailSender.sendEmail.mockResolvedValue(undefined);

      //Act
      const result = await useCase.run(dto);

      // Assert
      expect(result).toBeUndefined();

      expect(accountRepository.findById).toHaveBeenCalledWith(dto.accountId);

      expect(generateVerificationCode).toHaveBeenCalledTimes(1);

      expect(bcryptHashMock).toHaveBeenCalledWith('654321', 10);

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
