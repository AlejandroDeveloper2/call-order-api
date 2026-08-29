/* eslint-disable @typescript-eslint/unbound-method */
/** Ports */
import {
  EncryptorPort,
  VerificationCodeLookupPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';

import {
  DateHandlerPort,
  EmailSenderPort,
} from '../../../../shared/domain/ports';

/** Use case */
import { ResendCodeUseCase } from './resend-code.usecase';

/** Command */
import { ResendCodeCommand } from '../../commands';
import {
  CodeNotExpiredYetException,
  InvalidCodeException,
} from '../../exceptions';
import { VerificationCodeValidationModel } from '../../../domain/models';
import { VerificationCode } from '../../../domain/entities';

type VerificationCodeRepositoryMock = Pick<
  VerificationCodeRepositoryPort,
  'refresh' | 'findExpiredForForwarding'
>;
type EmailSenderMock = Pick<EmailSenderPort, 'sendEmail'>;
type EncryptorMock = Pick<EncryptorPort, 'compare' | 'hash'>;
type VerificationCodeLookupMock = Pick<
  VerificationCodeLookupPort,
  'generateLookup'
>;
type DateHandlerMock = Pick<DateHandlerPort, 'isBefore' | 'addMinutes'>;

describe('ResendCodeUseCase', () => {
  let useCase: ResendCodeUseCase;
  let verificationCodeRepositoryMock: jest.Mocked<VerificationCodeRepositoryMock>;
  let emailSenderMock: jest.Mocked<EmailSenderMock>;
  let encryptorMock: jest.Mocked<EncryptorMock>;
  let verificationCodeLookupMock: jest.Mocked<VerificationCodeLookupMock>;
  let dateHandlerMock: jest.Mocked<DateHandlerMock>;

  const resendCodeCommand: ResendCodeCommand = {
    email: 'jhon.doe@example.com',
    expiredCode: '123456',
  };

  const codeLookup = 'test-code-lookup';

  const verificationCode: VerificationCodeValidationModel = {
    verificationCodeId: 'test-verification-code-id',
    codeHash: 'code-stored-hash',
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    attempts: 0,
    accountId: 'test-account-id',
    profile: {
      profileId: 'test-profile-id',
      roleId: 'test-role-id',
    },
  };

  beforeEach(() => {
    verificationCodeRepositoryMock = {
      refresh: jest.fn(),
      findExpiredForForwarding: jest.fn(),
    };

    emailSenderMock = {
      sendEmail: jest.fn(),
    };

    encryptorMock = {
      compare: jest.fn(),
      hash: jest.fn(),
    };

    verificationCodeLookupMock = {
      generateLookup: jest.fn().mockReturnValue(codeLookup),
    };

    dateHandlerMock = {
      isBefore: jest.fn(),
      addMinutes: jest.fn(),
    };

    useCase = new ResendCodeUseCase(
      verificationCodeRepositoryMock as unknown as VerificationCodeRepositoryPort,
      emailSenderMock,
      encryptorMock,
      verificationCodeLookupMock,
      dateHandlerMock as unknown as DateHandlerPort,
    );

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('run()', () => {
    it('deberia lanzar InvalidCodeException cuando el correo proporcionado no exista', async () => {
      // Arrange
      const wrongEmail = 'peter.doe@example.com';

      verificationCodeRepositoryMock.findExpiredForForwarding.mockResolvedValue(
        null,
      );

      // Act
      const result = useCase.run({
        ...resendCodeCommand,
        email: wrongEmail,
      });

      //Assert
      await expect(result).rejects.toThrow(InvalidCodeException);

      expect(
        verificationCodeRepositoryMock.findExpiredForForwarding,
      ).toHaveBeenCalledWith(wrongEmail, codeLookup);

      expect(verificationCodeLookupMock.generateLookup).toHaveBeenCalledTimes(
        1,
      );

      expect(encryptorMock.compare).not.toHaveBeenCalled();
      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(verificationCodeRepositoryMock.refresh).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('deberia lanzar InvalidCodeException si el código es invalido', async () => {
      // Arrange
      verificationCodeRepositoryMock.findExpiredForForwarding.mockResolvedValue(
        verificationCode,
      );

      encryptorMock.compare.mockResolvedValue(false);

      // Act
      const result = useCase.run({
        ...resendCodeCommand,
        expiredCode: '456123',
      });

      //Assert
      await expect(result).rejects.toThrow(InvalidCodeException);

      expect(
        verificationCodeRepositoryMock.findExpiredForForwarding,
      ).toHaveBeenCalledWith(resendCodeCommand.email, codeLookup);

      expect(verificationCodeLookupMock.generateLookup).toHaveBeenCalledTimes(
        1,
      );

      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(verificationCodeRepositoryMock.refresh).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('deberia lanzar CodeNotExpiredYetException cuando el código aun no ha expirado', async () => {
      // Arrange
      verificationCodeRepositoryMock.findExpiredForForwarding.mockResolvedValue(
        verificationCode,
      );

      encryptorMock.compare.mockResolvedValue(true);

      dateHandlerMock.isBefore.mockReturnValue(true);

      //Act
      const result = useCase.run(resendCodeCommand);

      // Assert
      await expect(result).rejects.toThrow(CodeNotExpiredYetException);

      expect(
        verificationCodeRepositoryMock.findExpiredForForwarding,
      ).toHaveBeenCalledWith(resendCodeCommand.email, codeLookup);

      expect(verificationCodeLookupMock.generateLookup).toHaveBeenCalledTimes(
        1,
      );

      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(verificationCodeRepositoryMock.refresh).not.toHaveBeenCalled();
      expect(emailSenderMock.sendEmail).not.toHaveBeenCalled();
    });

    it('deberia generar y actualizar un nuevo código cuando el código ingresado es válido y ya ha expirado', async () => {
      //Arrange
      const code = {
        ...verificationCode,
        expiresAt: new Date(Date.now() - 5 * 60 * 1000),
      };
      const newHashedCode = 'new-hashed-code';
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      verificationCodeRepositoryMock.findExpiredForForwarding.mockResolvedValue(
        code,
      );
      encryptorMock.compare.mockResolvedValue(true);

      dateHandlerMock.isBefore.mockReturnValue(false);

      jest.spyOn(VerificationCode, 'generate').mockReturnValue('789123');

      encryptorMock.hash.mockResolvedValue(newHashedCode);

      dateHandlerMock.addMinutes.mockReturnValue(expiresAt);

      verificationCodeRepositoryMock.refresh.mockResolvedValue(1);

      emailSenderMock.sendEmail.mockResolvedValue(undefined);

      //Act
      const result = await useCase.run(resendCodeCommand);

      // Assert
      expect(result).toBeUndefined();

      expect(
        verificationCodeRepositoryMock.findExpiredForForwarding,
      ).toHaveBeenCalledWith(resendCodeCommand.email, codeLookup);

      expect(encryptorMock.compare).toHaveBeenCalledWith(
        resendCodeCommand.expiredCode,
        code.codeHash,
      );

      expect(VerificationCode.generate).toHaveBeenCalledTimes(1);
      expect(verificationCodeLookupMock.generateLookup).toHaveBeenCalledTimes(
        2,
      );
      expect(encryptorMock.hash).toHaveBeenCalledWith('789123', 10);

      expect(verificationCodeRepositoryMock.refresh).toHaveBeenCalledTimes(1);

      expect(verificationCodeRepositoryMock.refresh).toHaveBeenCalledWith(
        code.verificationCodeId,
        expect.objectContaining({
          attempts: code.attempts + 1,
          codeHash: newHashedCode,
          codeLookup,
          expiresAt,
        }),
      );

      expect(emailSenderMock.sendEmail).toHaveBeenCalledTimes(1);
      expect(emailSenderMock.sendEmail).toHaveBeenCalledWith(
        resendCodeCommand.email,
        'Código de verificación de CallOrder',
        expect.stringContaining('789123'),
      );
    });
  });
});
