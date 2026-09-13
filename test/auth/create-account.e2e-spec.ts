import request from 'supertest';
import { VersioningType, type INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';

/** Puertos */
import { EMAIL_SENDER_KEY } from '../../src/shared/domain/ports';

/** Seeds */
import { AccountSeeder } from '../../src/shared/infrastructure/seed/account.seeder';
import { RolesSeeder } from '../../src/shared/infrastructure/seed/roles.seeder';

/** Módulos */
import { AppModule } from '../../src/app.module';
import { SeederModule } from '../../src/shared/infrastructure/seed/seeder.module';

/** Adapters */
import { FakeEmailSender } from '../fakers/fake-email-sender.adapter';

/** Filtros */
import { AppExceptionFilter } from '../../src/shared/infrastructure/filters/app-exception.filter';

describe('POST /auth/register', () => {
  let app: INestApplication<App>;
  let accountSeeder: AccountSeeder;
  let rolesSeeder: RolesSeeder;
  let accessToken: string;

  const fakeEmailSenderAdapter = new FakeEmailSender();

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule, SeederModule],
    })
      .overrideProvider(EMAIL_SENDER_KEY)
      .useValue(fakeEmailSenderAdapter)
      .compile();

    accountSeeder = moduleFixture.get(AccountSeeder);
    rolesSeeder = moduleFixture.get(RolesSeeder);
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

  describe('cuando el usuario autenticado tiene los permisos para crear cuentas de usuario', () => {
    it('POST /auth/login como administrador', async () => {
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

    it('deberia crear una cuenta de usuario con los datos y credenciales proporcionados', async () => {
      // Arrange
      const role = (await rolesSeeder.getAllRoles()).at(0);

      const accountData = {
        fullname: 'Joe Smith',
        phone: '+573124557788',
        email: 'joe.smith@example.com',
        password: 'Password123456@',
        roleId: role ? role.id : 'role-id',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(accountData)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          httpCode: 201,
          message: 'Cuenta creada con éxito',
        }),
      );
    });

    it('deberia lanzar un error de cuenta existente si el correo de la cuenta a crear ya esta asociado a otra cuenta ya existente', async () => {
      // Arrange
      const role = (await rolesSeeder.getAllRoles()).at(0);

      const accountData = {
        fullname: 'Joe Smith',
        phone: '+573124557788',
        email: 'joe.smith@example.com',
        password: 'Password123456@',
        roleId: role ? role.id : 'role-id',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(accountData)
        .set('Authorization', `Bearer ${accessToken}`);

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe(
        'ACCOUNT_ALREADY_EXISTS',
      );
    });
  });

  describe('cuando el usuario autenticado no tiene los permisos para crear cuentas de usuario', () => {
    let token: string;
    it('POST /auth/login como agente', async () => {
      // Arrange
      const credentials = {
        email: 'sara.doe@example.com',
        password: 'Password1212@!',
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
          email: 'sara.doe@example.com',
        });

      // Assert
      token = (
        response.body as {
          data: { token: string; refreshToken: string };
        }
      ).data.token;

      expect(response.status).toBe(200);
    });

    it('deberia lanzar un error de permisisos insuficientes', async () => {
      // Arrange
      const role = (await rolesSeeder.getAllRoles()).at(1);

      const accountData = {
        fullname: 'Jerry Clinton',
        phone: '+573114558811',
        email: 'jerry.clinton@example.com',
        password: 'Password1122@',
        roleId: role ? role.id : 'role-id',
      };

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send(accountData)
        .set('Authorization', `Bearer ${token}`);

      // Assert
      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('httpCode');
      expect((response.body as { name: string }).name).toBe(
        'INSUFFICIENT_PERMISSIONS',
      );
    });
  });
});
