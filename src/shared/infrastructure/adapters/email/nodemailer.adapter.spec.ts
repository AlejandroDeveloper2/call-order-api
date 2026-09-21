/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import { EmailSenderException } from '../../exceptions';

import { getIdentityValidationEmailTemplate } from './templates/identity-validation-email.template';

import { NodeMailerAdapter } from './nodemailer.adapter';

type NodeMailerMock = jest.Mocked<typeof nodemailer>;
type ConfigServiceMock = Pick<ConfigService, 'get'>;

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

describe('NodeMailerAdapter', () => {
  let sendMailMock: jest.MockedFunction<nodemailer.Transporter['sendMail']>;
  let configServiceMock: jest.Mocked<ConfigServiceMock>;
  let nodeMailerMock: NodeMailerMock;

  beforeEach(() => {
    sendMailMock = jest
      .fn()
      .mockResolvedValue(undefined) as jest.MockedFunction<
      nodemailer.Transporter['sendMail']
    >;

    nodeMailerMock = nodemailer as NodeMailerMock;
    nodeMailerMock.createTransport.mockReturnValue({
      sendMail: sendMailMock,
    } as unknown as nodemailer.Transporter);

    configServiceMock = {
      get: jest.fn((key: string) => {
        if (key === 'NODE_MAILER_USER') {
          return 'smtp-user';
        }

        if (key === 'NODE_MAILER_PASSWORD') {
          return 'smtp-password';
        }

        return undefined;
      }),
    } as unknown as jest.Mocked<ConfigServiceMock>;

    jest.clearAllMocks();

    nodeMailerMock.createTransport.mockReturnValue({
      sendMail: sendMailMock,
    } as unknown as nodemailer.Transporter);
  });

  it('deberia configurar el transporter SMTP con las credenciales', () => {
    // Arrange
    new NodeMailerAdapter(configServiceMock as unknown as ConfigService);

    // Act
    const result = nodeMailerMock.createTransport.mock.calls[0][0] as {
      host: string;
      port: number;
      secure: boolean;
      auth: { user: string; pass: string };
    };

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
    const adapter = new NodeMailerAdapter(
      configServiceMock as unknown as ConfigService,
    );

    // Act
    await adapter.sendEmail('john@example.com', 'Validacion', '123456');

    // Assert
    expect(sendMailMock).toHaveBeenCalledWith({
      from: '"CallOrder" <diegodiazdev9817@gmail.com>',
      to: 'john@example.com',
      subject: 'Validacion',
      html: getIdentityValidationEmailTemplate('123456'),
    });
  });

  it('deberia convertir errores Error en EmailSenderException', async () => {
    // Arrange
    sendMailMock.mockRejectedValue(new Error('SMTP unavailable'));
    const adapter = new NodeMailerAdapter(
      configServiceMock as unknown as ConfigService,
    );

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
    sendMailMock.mockRejectedValue('SMTP unavailable');
    const adapter = new NodeMailerAdapter(
      configServiceMock as unknown as ConfigService,
    );

    // Act
    const result = adapter.sendEmail('john@example.com', 'Subject', 'Body');

    // Assert
    await expect(result).rejects.toThrow(
      'An error occurred while sending the email: SMTP unavailable',
    );
  });
});
