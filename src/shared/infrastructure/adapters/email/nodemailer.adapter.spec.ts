jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

import { EmailSenderException } from '../../exceptions';
import { getIdentityValidationEmailTemplate } from './templates/identity-validation-email.template';
import { NodeMailerAdapter } from './nodemailer.adapter';

describe('NodeMailerAdapter', () => {
  let sendMail: jest.Mock;
  let configService: ConfigService;

  beforeEach(() => {
    sendMail = jest.fn().mockResolvedValue(undefined);
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });
    configService = {
      get: jest.fn((key: string) =>
        key === 'NODE_MAILER_USER' ? 'smtp-user' : 'smtp-password',
      ),
    } as unknown as ConfigService;
  });

  it('deberia configurar el transporter SMTP con las credenciales', () => {
    // Arrange
    new NodeMailerAdapter(configService);

    // Act
    const result = (nodemailer.createTransport as jest.Mock).mock.calls[0][0];

    // Assert
    expect(result).toEqual({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: 'smtp-user', pass: 'smtp-password' },
    });
  });

  it('deberia enviar un correo con la plantilla de validacion', async () => {
    // Arrange
    const adapter = new NodeMailerAdapter(configService);

    // Act
    await adapter.sendEmail('john@example.com', 'Validacion', '123456');

    // Assert
    expect(sendMail).toHaveBeenCalledWith({
      from: '"CallOrder" <diegodiazdev9817@gmail.com>',
      to: 'john@example.com',
      subject: 'Validacion',
      html: getIdentityValidationEmailTemplate('123456'),
    });
  });

  it('deberia convertir errores Error en EmailSenderException', async () => {
    // Arrange
    sendMail.mockRejectedValue(new Error('SMTP unavailable'));
    const adapter = new NodeMailerAdapter(configService);

    // Act
    const result = adapter.sendEmail('john@example.com', 'Subject', 'Body');

    // Assert
    await expect(result).rejects.toThrow(
      'An error occurred while sending the email: SMTP unavailable',
    );
    await expect(result).rejects.toBeInstanceOf(EmailSenderException);
  });

  it('deberia convertir errores no Error a texto', async () => {
    // Arrange
    sendMail.mockRejectedValue('SMTP unavailable');
    const adapter = new NodeMailerAdapter(configService);

    // Act
    const result = adapter.sendEmail('john@example.com', 'Subject', 'Body');

    // Assert
    await expect(result).rejects.toThrow(
      'An error occurred while sending the email: SMTP unavailable',
    );
  });
});
