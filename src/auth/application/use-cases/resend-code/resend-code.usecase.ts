import { Inject, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { addMinutes, isBefore } from 'date-fns';

/** Ports */
import {
  VERIFICATION_CODE_REPOSITORY,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import {
  EMAIL_SENDER_KEY,
  type EmailSenderPort,
} from '../../../../shared/domain/ports';

/** Exceptions */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';
import { AppError } from '../../../../shared/domain/exceptions';

/** Utilidades */
import { generateVerificationCode } from '../../../domain/utils/generate-validation-code';

/** Dtos */
import { ResendCodeDto } from '../../dto';

@Injectable()
export class ResendCodeUseCase {
  constructor(
    @Inject(VERIFICATION_CODE_REPOSITORY)
    private readonly verificationCodeRepository: VerificationCodeRepositoryPort,
    @Inject(EMAIL_SENDER_KEY)
    private readonly emailSender: EmailSenderPort,
  ) {}
  /** Logica para enviar código de verificación de nuevo si el anterior expiró */
  async run(sendCodeDto: ResendCodeDto): Promise<void> {
    const { accountId, expiredCode, email } = sendCodeDto;

    const codes =
      await this.verificationCodeRepository.findByAccountId(accountId);

    const results = await Promise.all(
      codes.map(async (code) => {
        const isValid = await bcrypt.compare(expiredCode, code.codeHash);
        return { ...code, isValid };
      }),
    );

    const validCode = results.find((r) => r.isValid);

    /** Validar si el código ingresado es valido*/
    if (!validCode)
      throw new AppError(
        AUTH_ERROR_CODES.invalidCode,
        401,
        'Código de verificación de autenticación invalido',
        true,
      );

    /** Validar si el código ingresado esta expirado */
    if (isBefore(new Date(), new Date(validCode.expiresAt)))
      throw new AppError(
        AUTH_ERROR_CODES.codeNotExpiredYet,
        400,
        'El código ingresado aun no ha expirado',
        true,
      );

    /** Generar nuevo código y reenviarlo al correo del usuario */
    await this.generateAndResendCode({
      oldVerficationCodeId: validCode.verificationCodeId,
      attempts: validCode.attempts,
      email,
    });
  }

  private async generateAndResendCode(payload: {
    oldVerficationCodeId: string;
    attempts: number;
    email: string;
  }) {
    const { oldVerficationCodeId, attempts, email } = payload;
    /** Generar un nuevo código de verificación */
    const code = generateVerificationCode();
    const codeHash = await bcrypt.hash(code, 10);

    /** Actualizar a nivel de base de datos el valor del nuevo código */
    await this.verificationCodeRepository.updateCodeHash(oldVerficationCodeId, {
      attempts: attempts + 1,
      codeHash,
      expiresAt: addMinutes(new Date(), 10),
    });
    /** Enviar correo con nuevo código */
    await this.emailSender.sendEmail(
      email,
      'Código de verificación de CallOrder',
      this.buildVerificationEmail(code),
    );
  }

  private buildVerificationEmail(code: string): string {
    return `
      <p>Tu código de verificación es:</p>
      <p><strong>${code}</strong></p>
      <p>Este código expirará en 10 minutos.</p>
    `;
  }
}
