import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { NodeMailerAdapter } from './infrastructure/adapters/nodemailer.adapter';

@Module({
  imports: [ConfigModule],
  providers: [NodeMailerAdapter],
  exports: [NodeMailerAdapter],
})
export class SharedModule {}
