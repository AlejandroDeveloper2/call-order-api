/** Entidades */
import { VerificationCode } from '../../../domain/entities';

/** Puertos */
import {
  EncryptorPort,
  VerificationCodeLookupPort,
  VerificationCodeRepositoryPort,
} from '../../../domain/ports';
import {
  EmailSenderPort,
  DateHandlerPort,
} from '../../../../shared/domain/ports';

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
    private readonly dateHandler: DateHandlerPort,
  ) {}
  /** Logica para enviar código de verificación de nuevo si el anterior expiró */
  async run(resendCodeCommand: ResendCodeCommand): Promise<void> {
    /** Validar entradas con value objects */
    const email = Email.create(resendCodeCommand.email);
    const expiredCode = Code.create(resendCodeCommand.expiredCode);

    const codeLookup = this.verificationCodeLookup.generateLookup(
      expiredCode.toString(),
    );

    /** Obtener la cuenta asociada al accountId proporcionado */
    const verificationCode =
      await this.verificationCodeRepository.findExpiredForForwarding(
        email.toString(),
        codeLookup,
      );

    if (!verificationCode)
      throw new InvalidCodeException(
        'Código de verificación de autenticación invalido',
      );

    /** Comparar el hash del código para filtrar el código de verificación actual */
    const isValid = await this.encryptor.compare(
      expiredCode.toString(),
      verificationCode.codeHash,
    );

    /** Validar si el código ingresado es valido*/
    if (!isValid)
      throw new InvalidCodeException(
        'Código de verificación de autenticación invalido',
      );

    /** Validar si el código ingresado esta expirado */
    if (
      this.dateHandler.isBefore(
        new Date(),
        new Date(verificationCode.expiresAt),
      )
    )
      throw new CodeNotExpiredYetException('El código aun no ha expirado');

    /** Generar nuevo código y reenviarlo al correo del usuario */
    await this.generateAndResendCode({
      oldVerficationCodeId: verificationCode.verificationCodeId,
      attempts: verificationCode.attempts,
      email: email.toString(),
    });
  }

  private async generateAndResendCode(payload: {
    oldVerficationCodeId: string;
    attempts: number;
    email: string;
  }) {
    const { oldVerficationCodeId, attempts, email } = payload;

    /** Generar un nuevo código de verificación */
    const generatedCode = VerificationCode.generate();

    /** Validar con el value object */
    const code = Code.create(generatedCode);

    /** Generar el codeLookup */
    const codeLookup = this.verificationCodeLookup.generateLookup(
      code.toString(),
    );

    /** Generar el hash para el nuevo código */
    const codeHash = await this.encryptor.hash(code.toString(), 10);

    /** Actualizar a nivel de base de datos el valor del nuevo código */
    await this.verificationCodeRepository.refresh(oldVerficationCodeId, {
      attempts: attempts + 1,
      codeHash,
      codeLookup,
      expiresAt: this.dateHandler.addMinutes(new Date(), 10),
    });
    /** Enviar correo con nuevo código */
    await this.emailSender.sendEmail(
      email,
      'Código de verificación de CallOrder',
      this.buildVerificationEmail(code.toString()),
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
