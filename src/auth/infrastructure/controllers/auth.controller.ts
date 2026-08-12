import { Body, Controller, Post } from '@nestjs/common';

import { LoginUseCase } from '../../application/use-cases/login/login.usecase';

import { LoginDto } from '../../application/dto';

import { ApiMessage } from '../../../shared/infrastructure/decorators';

@Controller('auth')
export class AuthController {
  constructor(private readonly loginUseCase: LoginUseCase) {}

  @Post('/login')
  @ApiMessage('Inicio de sesión correcto')
  postLogin(@Body() loginDto: LoginDto) {
    return this.loginUseCase.run(loginDto);
  }
}
