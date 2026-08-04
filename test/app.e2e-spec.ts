import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';

import * as dotenv from 'dotenv';
import * as path from 'path';

import { AppModule } from './../src/app.module';

dotenv.config({ path: path.resolve(__dirname, '../.env.test') });

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect({ data: 'Hello World!', message: 'Success', httpCode: 200 });
  });

  afterEach(async () => {
    await app.close();
  });
});
