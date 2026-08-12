export interface EmailSenderPort {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}

export const EMAIL_SENDER_KEY = 'EMAIL_SENDER_KEY';
