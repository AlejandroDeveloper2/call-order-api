import { EmailSenderPort } from '../../src/shared/domain/ports';

type SentEmail = {
  code: string;
  to: string;
  subject: string;
};
export class FakeEmailSender implements EmailSenderPort {
  private readonly sentEmails: SentEmail[] = [];
  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    this.sentEmails.push({
      to,
      code: body,
      subject,
    });

    await Promise.resolve();
  }

  getLastEmail(): SentEmail | undefined {
    return this.sentEmails.at(-1);
  }

  findEmail(email: string): SentEmail | undefined {
    return this.sentEmails.find((message) => message.to === email);
  }

  getEmails(): SentEmail[] {
    return [...this.sentEmails];
  }

  clear(): void {
    this.sentEmails.length = 0;
  }
}
