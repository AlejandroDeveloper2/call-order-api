import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  CloudinaryAdpater,
  NodeMailerAdapter,
} from './infrastructure/adapters';

import { CloudinaryUploadInterceptor } from './infrastructure/interceptors';

import { EMAIL_SENDER_KEY } from './domain/ports';

@Module({
  imports: [ConfigModule],
  providers: [
    { provide: EMAIL_SENDER_KEY, useClass: NodeMailerAdapter },
    CloudinaryAdpater,
    CloudinaryUploadInterceptor,
  ],
  exports: [
    { provide: EMAIL_SENDER_KEY, useClass: NodeMailerAdapter },
    CloudinaryAdpater,
    CloudinaryUploadInterceptor,
  ],
})
export class SharedModule {}
