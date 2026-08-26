import { addMinutes, isBefore } from 'date-fns';

/** Entidades */
import { VerificationCode } from '../../../domain/entities';

/** Puertos */
import {
  EncryptorPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import { EmailSenderPort } from '../../../../shared/domain/ports';

/** Exceptions */
import {
  CodeNotExpiredYetException,
  InvalidCodeException,
} from '../../exceptions';

/** Value Objects */
import { Code, Email } from '../../../domain/value-objects';

/** Modelos de lectura */
import { VerificationCodeValidationModel } from '../../../domain/models';

/** Commands */
import { ResendCodeCommand } from '../../commands';

export class ResendCodeUseCase {
  constructor(
    private readonly verificationCodeRepository: VerificationCodeRepositoryPort,
    private readonly emailSender: EmailSenderPort,
    private readonly encryptor: EncryptorPort,
  ) {}
  /** Logica para enviar código de verificación de nuevo si el anterior expiró */
  async run(resendCodeCommand: ResendCodeCommand): Promise<void> {
    const { expiredCode, email } = resendCodeCommand;

    /** Validar entradas con value objects */
    const emailValue = Email.create(email).toString();
    const expiredCodeValue = Code.create(expiredCode).toString();

    /** Obtener la cuenta asociada al accountId proporcionado */
    const verificationCodes =
      await this.verificationCodeRepository.findExpiredForForwarding(
        emailValue,
      );

    /** Comparar el hash del código para filtrar el código de verificación actual */
    let validCode: VerificationCodeValidationModel | null = null;
    for (const verificationCode of verificationCodes) {
      const isValid = await this.encryptor.compare(
        expiredCodeValue,
        verificationCode.codeHash,
      );
      if (isValid) {
        validCode = verificationCode;
        break;
      }
    }

    /** Validar si el código ingresado es valido*/
    if (!validCode)
      throw new InvalidCodeException(
        'Código de verificación de autenticación invalido',
      );

    /** Validar si el código ingresado esta expirado */
    if (isBefore(new Date(), new Date(validCode.expiresAt)))
      throw new CodeNotExpiredYetException('El código aun no ha expirado');

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
    const code = VerificationCode.generate();

    /** Validar con el value object */
    const codeValue = Code.create(code).toString();

    /** Generar el hash para el nuevo código */
    const codeHash = await this.encryptor.hash(codeValue, 20);

    /** Actualizar a nivel de base de datos el valor del nuevo código */
    await this.verificationCodeRepository.refresh(oldVerficationCodeId, {
      attempts: attempts + 1,
      codeHash,
      expiresAt: addMinutes(new Date(), 10),
    });
    /** Enviar correo con nuevo código */
    await this.emailSender.sendEmail(
      email,
      'Código de verificación de CallOrder',
      this.buildVerificationEmail(codeValue),
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
