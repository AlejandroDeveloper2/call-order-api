import request from 'supertest';
import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

/** Puertos */
import { EMAIL_SENDER_KEY } from '../../src/shared/domain/ports';

/** Seeds */
import { AccountSeeder } from '../../src/shared/infrastructure/seed/account.seeder';
import { VerificationCodesSeeder } from '../../src/shared/infrastructure/seed/verification-codes.seeder';

/** Módulos */
import { AppModule } from '../../src/app.module';
import { SeederModule } from '../../src/shared/infrastructure/seed/seeder.module';

/** Adapters */
import { FakeEmailSender } from '../fakers/fake-email-sender.adapter';

/** Filtros */
import { AppExceptionFilter } from '../../src/shared/infrastructure/filters/app-exception.filter';

describe('POST /auth/validate', () => {
  let app: INestApplication<App>;
  let accountSeeder: AccountSeeder;
  let codesSeeder: VerificationCodesSeeder;

  const fakeEmailSenderAdapter = new FakeEmailSender();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    })
      .overrideProvider(EMAIL_SENDER_KEY)
      .useValue(fakeEmailSenderAdapter)
      .compile();

    accountSeeder = moduleFixture.get(AccountSeeder);
    codesSeeder = moduleFixture.get(VerificationCodesSeeder);
    await accountSeeder.seed();
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
    await accountSeeder?.drop();
    await app?.close();
  });

  describe('cuando el usuario valida su identidad', () => {
    it('POST /auth/login', async () => {
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

    it('deberia verificar el código de verificación y generar los tokens de acceso', async () => {
      // Arrange
      const email = fakeEmailSenderAdapter.getLastEmail();

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/validate')
        .send({
          verificationCode: email ? email.code : '000000',
          email: 'jhon.doe@example.com',
        });

      // Assert
      const validationResult = response.body as {
        data: { token: string; refreshToken: string };
      };

      expect(response.status).toBe(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          data: {
            token: validationResult.data.token,
            refreshToken: validationResult.data.refreshToken,
          },
          httpCode: 200,
          message: 'Identidad verificada con éxito',
        }),
      );
    });
  });

  describe('cuando el código de verificación es invalido', () => {
    it('deberia lanzar un error de código invalido', async () => {
      // Arrange
      const invalidCode = '123456';

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/validate')
        .send({
          verificationCode: invalidCode,
          email: 'jhon.doe@example.com',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('INVALID_CODE');
    });
  });

  describe('cuando el código de verificación ha expirado', () => {
    it('deberia lanzar un error de código expirado', async () => {
      //Arrange
      await codesSeeder.updateToExpiredCode('jhon.doe@example.com');
      const email = fakeEmailSenderAdapter.getLastEmail();

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/validate')
        .send({
          verificationCode: email ? email.code : '000000',
          email: 'jhon.doe@example.com',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('EXPIRED_CODE');
    });
  });
});
