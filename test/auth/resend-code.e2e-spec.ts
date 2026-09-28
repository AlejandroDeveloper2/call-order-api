import request from 'supertest';
import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { addMinutes } from 'date-fns';

import { EMAIL_SENDER_KEY } from '../../src/shared/domain/ports';

import { AuthSeeder } from '../../src/shared/infrastructure/seed/auth.seeder';

import { FakeEmailSender } from '../fakers/fake-email-sender.adapter';

import { AppExceptionFilter } from '../../src/shared/infrastructure/filters/app-exception.filter';

import { AppModule } from '../../src/app.module';
import { SeederModule } from '../../src/shared/infrastructure/seed/seeder.module';

describe('POST /auth/resend/code', () => {
  let app: INestApplication<App>;
  let authSeeder: AuthSeeder;

  const fakeEmailSenderAdapter = new FakeEmailSender();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    })
      .overrideProvider(EMAIL_SENDER_KEY)
      .useValue(fakeEmailSenderAdapter)
      .compile();

    authSeeder = moduleFixture.get(AuthSeeder);

    await authSeeder.seed();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    fakeEmailSenderAdapter.clear();
    await authSeeder?.drop();
    await app?.close();
  });

  describe('cuando un código de verificación ha expirado', () => {
    it('POST /auth/login iniciar sesión', async () => {
      // Arrange
      const credentials = {
        email: 'jhon.doe@example.com',
        password: 'Password1234@!',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password,
        });

      // Assert
      expect(response.status).toBe(200);
    });

    it('deberia generar y reenviar al correo electrónico del usuario que esta intentando autenticarse', async () => {
      // Arrange
      await authSeeder.updateCodeByEmail(
        'jhon.doe@example.com',
        {
          expiresAt: addMinutes(new Date(), -11),
        },
        true,
      );
      const email = fakeEmailSenderAdapter.getLastEmail();

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/resend/code')
        .send({
          email: 'jhon.doe@example.com',
          expiredCode: email ? email.code : '000000',
        });

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('cuando el código de verificación es invalido', () => {
    it('deberia lanzar un error de código invalido', async () => {
      // Arrange
      const invalidCode = '123456';

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/resend/code')
        .send({
          expiredCode: invalidCode,
          email: 'jhon.doe@example.com',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('INVALID_CODE');
    });
  });

  describe('cuando el código de verificación no ha expirado aun', () => {
    it('deberia lanzar un error de código no expirado aun', async () => {
      // Arrange
      await authSeeder.updateCodeByEmail(
        'jhon.doe@example.com',
        {
          expiresAt: addMinutes(new Date(), 10),
        },
        true,
      );
      const email = fakeEmailSenderAdapter.getLastEmail();

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/resend/code')
        .send({
          expiredCode: email ? email.code : '000000',
          email: 'jhon.doe@example.com',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe(
        'CODE_NOT_EXPIRED_YET',
      );
    });
  });
});
