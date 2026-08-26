import { addMinutes, isBefore } from 'date-fns';

/** Entidades */
import { VerificationCode } from '../../../domain/entities';

/** Puertos */
import {
  EncryptorPort,
  VerificationCodeLookupPort,
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

/** Commands */
import { ResendCodeCommand } from '../../commands';

export class ResendCodeUseCase {
  constructor(
    private readonly verificationCodeRepository: VerificationCodeRepositoryPort,
    private readonly emailSender: EmailSenderPort,
    private readonly encryptor: EncryptorPort,
    private readonly verificationCodeLookup: VerificationCodeLookupPort,
  ) {}
  /** Logica para enviar código de verificación de nuevo si el anterior expiró */
  async run(resendCodeCommand: ResendCodeCommand): Promise<void> {
    const { expiredCode, email } = resendCodeCommand;

    /** Validar entradas con value objects */
    const emailValue = Email.create(email).toString();
    const expiredCodeValue = Code.create(expiredCode).toString();

    const codeLookup =
      this.verificationCodeLookup.generateLookup(expiredCodeValue);

    /** Obtener la cuenta asociada al accountId proporcionado */
    const verificationCode =
      await this.verificationCodeRepository.findExpiredForForwarding(
        emailValue,
        codeLookup,
      );

    if (!verificationCode)
      throw new InvalidCodeException(
        'Código de verificación de autenticación invalido',
      );

    /** Comparar el hash del código para filtrar el código de verificación actual */
    const isValid = await this.encryptor.compare(
      expiredCodeValue,
      verificationCode.codeHash,
    );

    /** Validar si el código ingresado es valido*/
    if (!isValid)
      throw new InvalidCodeException(
        'Código de verificación de autenticación invalido',
      );

    /** Validar si el código ingresado esta expirado */
    if (isBefore(new Date(), new Date(verificationCode.expiresAt)))
      throw new CodeNotExpiredYetException('El código aun no ha expirado');

    /** Generar nuevo código y reenviarlo al correo del usuario */
    await this.generateAndResendCode({
      oldVerficationCodeId: verificationCode.verificationCodeId,
      attempts: verificationCode.attempts,
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

    /** Generar el codeLookup */
    const codeLookup = this.verificationCodeLookup.generateLookup(codeValue);

    /** Generar el hash para el nuevo código */
    const codeHash = await this.encryptor.hash(codeValue, 20);

    /** Actualizar a nivel de base de datos el valor del nuevo código */
    await this.verificationCodeRepository.refresh(oldVerficationCodeId, {
      attempts: attempts + 1,
      codeHash,
      codeLookup,
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
