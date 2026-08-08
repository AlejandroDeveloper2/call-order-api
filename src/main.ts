import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function bootstrap() {
  console.log('🚀 [1] Iniciando bootstrap...');
  const app = await NestFactory.create(AppModule);
  console.log('✅ [2] AppModule creado correctamente');
  /** Set global prefix */
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  /** Cookie parser */
  app.use(cookieParser());

  /** Cors settings */
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  /** Global validation pipe */
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  /** Start the server */
  await app.listen(process.env.PORT ?? 3000);

  const url = await app.getUrl();
  console.log(`Application is running on: ${url}`);
  console.log(`API V1 available at: ${url}/api/v1`);
}
void bootstrap();
