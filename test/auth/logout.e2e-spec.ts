import request from 'supertest';
import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

/** Puertos */
import { EMAIL_SENDER_KEY } from '../../src/shared/domain/ports';

/** Seeder */
import { AuthSeeder } from '../../src/shared/infrastructure/seed/auth.seeder';
import { FakeEmailSender } from '../fakers/fake-email-sender.adapter';

/** Modulos */
import { AppModule } from '../../src/app.module';
import { SeederModule } from '../../src/shared/infrastructure/seed/seeder.module';

/** Filtros */
import { AppExceptionFilter } from '../../src/shared/infrastructure/filters/app-exception.filter';

describe('POST /auth/logout', () => {
  let app: INestApplication<App>;
  let authSeeder: AuthSeeder;
  let accessToken: string;

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

  describe('cuando el usuario esta autenticado', () => {
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

    it('POST /auth/validate validar identidad', async () => {
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
      accessToken = (
        response.body as {
          data: { token: string; refreshToken: string };
        }
      ).data.token;

      expect(response.status).toBe(200);
    });

    it('deberia poder cerrar la sesión activa', async () => {
      // Arrange
      const body = {};

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send(body)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(200);
    });
  });

  describe('cuando el token de acceso es invalido', () => {
    it('deberia lanzar un error de token malformado', async () => {
      // Arrange
      const body = {};
      const wrongToken = 'token-11111';

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send(body)
        .set('Authorization', `Bearer ${wrongToken}`);

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('MALFORMED_TOKEN');
    });
  });

  describe('cuando el usuario no tiene una sesión activa', () => {
    it('deberia lanzar un error de sesión invalida', async () => {
      // Arrange
      const body = {};
      await authSeeder.clearSessionsByEmail('jhon.doe@example.com');

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/logout')
        .send(body)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('INVALID_SESSION');
    });
  });
});
