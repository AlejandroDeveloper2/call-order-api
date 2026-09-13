export abstract class EmailSenderPort {
  abstract sendEmail(
    to: string,
    subject: string,
    body: string,
    template?: 'identityValidation',
  ): Promise<void>;
}

export const EMAIL_SENDER_KEY = Symbol('EMAIL_SENDER_KEY');
