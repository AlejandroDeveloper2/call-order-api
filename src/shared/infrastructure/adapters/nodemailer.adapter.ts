import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { AppError, SHARED_ERROR_CODES } from '../../domain/exceptions';
import { EmailSenderPort } from '../../domain/ports/email-sender.port';

@Injectable()
export class NodeMailerAdapter implements EmailSenderPort {
  private transporter: nodemailer.Transporter;

  constructor(private readonly configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.get<string>('NODE_MAILER_USER') ?? '',
        pass: this.configService.get<string>('NODE_MAILER_PASSWORD') ?? '',
      },
    });
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: '"CallOrder" <diegodiazdev9817@gmail.com>',
        to,
        subject,
        html: body,
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      throw new AppError(
        SHARED_ERROR_CODES.emailSendingError,
        500,
        `An error occurred while sending the email: ${message}`,
        false,
      );
    }
  }
}
