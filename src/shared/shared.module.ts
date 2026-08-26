import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  CloudinaryAdpater,
  NodeMailerAdapter,
  TypeOrmTransactionManagerAdapter,
  UUIDAdapter,
} from './infrastructure/adapters';

import { CloudinaryUploadInterceptor } from './infrastructure/interceptors';

import {
  EMAIL_SENDER_KEY,
  FILE_UPLOADER,
  ID_GENERATOR_KEY,
  TRANSACTION_MANAGER,
} from './domain/ports';

@Module({
  imports: [ConfigModule],
  providers: [
    { provide: EMAIL_SENDER_KEY, useClass: NodeMailerAdapter },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManagerAdapter,
    },
    {
      provide: FILE_UPLOADER,
      useClass: CloudinaryAdpater,
    },
    CloudinaryUploadInterceptor,
    {
      provide: ID_GENERATOR_KEY,
      useClass: UUIDAdapter,
    },
  ],
  exports: [
    EMAIL_SENDER_KEY,
    TRANSACTION_MANAGER,
    FILE_UPLOADER,
    CloudinaryUploadInterceptor,
    ID_GENERATOR_KEY,
  ],
})
export class SharedModule {}
