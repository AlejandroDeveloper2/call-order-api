import request from 'supertest';
import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

/** Puertos */
import { EMAIL_SENDER_KEY } from '../../src/shared/domain/ports';

/** Módulos */
import { AppModule } from '../../src/app.module';
import { SeederModule } from '../../src/shared/infrastructure/seed/seeder.module';

/** Seeders */
import { AccountSeeder } from '../../src/shared/infrastructure/seed/account.seeder';

/** Filtros */
import { AppExceptionFilter } from '../../src/shared/infrastructure/filters/app-exception.filter';

describe('POST /auth/login', () => {
  let app: INestApplication<App>;
  let accountSeeder: AccountSeeder;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    })
      .overrideProvider(EMAIL_SENDER_KEY)
      .useValue({
        sendEmail: jest.fn(),
      })
      .compile();

    accountSeeder = moduleFixture.get(AccountSeeder);
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
    await accountSeeder?.drop();
    await app?.close();
  });

  describe('cuando las credenciales son válidas', () => {
    it('deberia verificar las credenciales y continuar el flujo de autenticación', async () => {
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
      expect(response.status).toBe(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          httpCode: 201,
          message: 'Credenciales verificadas correctamente',
        }),
      );
    });
  });

  describe('cuando las credenciales son inválidas', () => {
    it('deberia retornar un error de credenciales inválidas', async () => {
      // Arrange
      const credentials = {
        email: 'invalid@example.com',
        password: 'InvalidPassword123@!',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password,
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe(
        'INVALID_CREDENTIALS',
      );
    });
  });

  describe('cuando el usuario supera el número permitido de intentos fallidos de login', () => {
    it('deberia retornar un error de cuenta bloqueada', async () => {
      // Arrange
      const credentials = {
        email: 'tom.doe@example.com',
        password: 'Password7890@!',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password,
        });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('ACCOUNT_LOCKED');
    });
  });

  describe('cuando el usuario esta inactivo', () => {
    it('deberia retornar un error de cuenta inactiva', async () => {
      // Arrange
      const credentials = {
        email: 'jane.doe@example.com',
        password: 'Password1289@!',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: credentials.email,
          password: credentials.password,
        });

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe('INACTIVE_ACCOUNT');
    });
  });
});
