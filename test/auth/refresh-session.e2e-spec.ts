import request from 'supertest';
import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import cookieParser from 'cookie-parser';

/** Puertos */
import { EMAIL_SENDER_KEY } from '../../src/shared/domain/ports';

/** Seeds */
import { AccountSeeder } from '../../src/shared/infrastructure/seed/account.seeder';
import { SessionsSeeder } from '../../src/shared/infrastructure/seed/sessions.seeder';

/** Módulos */
import { AppModule } from '../../src/app.module';
import { SeederModule } from '../../src/shared/infrastructure/seed/seeder.module';

/** Filtros */
import { AppExceptionFilter } from '../../src/shared/infrastructure/filters/app-exception.filter';

/** Fakers */
import { FakeEmailSender } from '../fakers/fake-email-sender.adapter';

describe('POST /auth/refresh', () => {
  let app: INestApplication<App>;
  let accountSeeder: AccountSeeder;
  let sessionsSeeder: SessionsSeeder;
  let tokens: { token: string; refreshToken: string };

  const fakeEmailSenderAdapter = new FakeEmailSender();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    })
      .overrideProvider(EMAIL_SENDER_KEY)
      .useValue(fakeEmailSenderAdapter)
      .compile();

    accountSeeder = moduleFixture.get(AccountSeeder);
    sessionsSeeder = moduleFixture.get(SessionsSeeder);

    await accountSeeder.seed();
    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });
    app.use(cookieParser());
    app.useGlobalFilters(new AppExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    fakeEmailSenderAdapter.clear();
    await accountSeeder?.drop();
    await app?.close();
  });

  describe('cuando el usuario tiene una sesión activa pero ya expiró', () => {
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
      tokens = (
        response.body as {
          data: { token: string; refreshToken: string };
        }
      ).data;

      expect(response.status).toBe(200);
    });

    it('deberia refrescar la sesión del usuario autenticado', async () => {
      // Arrange
      await sessionsSeeder.updateToExpiredSession('jhon.doe@example.com');

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .set('Authorization', `Bearer ${tokens.token}`)
        .set('Cookie', `refresh_token=${tokens.refreshToken}`);

      // Assert
      const {
        data: { token, refreshToken },
      } = response.body as { data: { token: string; refreshToken: string } };

      expect(response.status).toBe(200);
      expect(response.body).toEqual(
        expect.objectContaining({
          data: {
            token,
            refreshToken,
          },
          httpCode: 200,
          message: 'Sesión actualizada con éxito',
        }),
      );
    });
  });

  describe('cuando la cookie con el refresh token no es proporcionada', () => {
    it('deberia lanzar un error de refresh token no proporcionado', async () => {
      // Arrange
      await sessionsSeeder.updateToExpiredSession('jhon.doe@example.com');

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .set('Authorization', `Bearer ${tokens.token}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe(
        'MISSING_REFRESH_TOKEN',
      );
    });
  });

  describe('cuando el token no es proporcionado', () => {
    it('deberia lanzar un error de token de acceso no proporcionado o esta malformado', async () => {
      // Arrange
      await sessionsSeeder.updateToExpiredSession('jhon.doe@example.com');

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .set('Cookie', `refresh_token=${tokens.refreshToken}`);

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('MISSING_TOKEN');
    });
  });

  describe('cuando el token no tiene un formato valido', () => {
    it('deberia lanzar un error de token de acceso malformado o invalido', async () => {
      // Arrange
      await sessionsSeeder.updateToExpiredSession('jhon.doe@example.com');

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/refresh')
        .send({})
        .set('Cookie', `refresh_token=${tokens.refreshToken}`)
        .set('Authorization', 'invalid-token-111');

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('MALFORMED_TOKEN');
    });
  });
});
