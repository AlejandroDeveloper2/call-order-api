import { Module } from '@nestjs/common';

import { AuthController } from './infrastructure/controllers/auth.controller';

@Module({
  controllers: [AuthController],
  providers: [],
})
export class AuthModule {}
