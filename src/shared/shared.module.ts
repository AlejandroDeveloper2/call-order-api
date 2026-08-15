import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  CloudinaryAdpater,
  NodeMailerAdapter,
  TypeOrmTransactionManagerAdapter,
} from './infrastructure/adapters';

import { CloudinaryUploadInterceptor } from './infrastructure/interceptors';

import { EMAIL_SENDER_KEY, TRANSACTION_MANAGER } from './domain/ports';

@Module({
  imports: [ConfigModule],
  providers: [
    { provide: EMAIL_SENDER_KEY, useClass: NodeMailerAdapter },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManagerAdapter,
    },
    CloudinaryAdpater,
    CloudinaryUploadInterceptor,
  ],
  exports: [
    { provide: EMAIL_SENDER_KEY, useClass: NodeMailerAdapter },
    {
      provide: TRANSACTION_MANAGER,
      useClass: TypeOrmTransactionManagerAdapter,
    },
    CloudinaryAdpater,
    CloudinaryUploadInterceptor,
  ],
})
export class SharedModule {}
