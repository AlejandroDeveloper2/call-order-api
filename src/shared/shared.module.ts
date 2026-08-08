import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import {
  CloudinaryAdpater,
  NodeMailerAdapter,
} from './infrastructure/adapters';

import { CloudinaryUploadInterceptor } from './infrastructure/interceptors';

@Module({
  imports: [ConfigModule],
  providers: [
    NodeMailerAdapter,
    CloudinaryAdpater,
    CloudinaryUploadInterceptor,
  ],
  exports: [NodeMailerAdapter, CloudinaryAdpater, CloudinaryUploadInterceptor],
})
export class SharedModule {}
