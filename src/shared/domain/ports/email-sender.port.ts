export interface EmailSenderPort {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
}
