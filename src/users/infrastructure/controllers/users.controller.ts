import { Body, Controller, Get, ParseUUIDPipe, Query } from '@nestjs/common';

import {
  FindUserByAccountUseCase,
  FindUsersUseCase,
} from '../../application/use-cases';

import {
  ApiMessage,
  GetAccount,
} from '../../../shared/infrastructure/decorators';
import { UserQueryDto } from '../../application/dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByAccountUseCase: FindUserByAccountUseCase,
    private readonly findUsers: FindUsersUseCase,
  ) {}

  @Get('/account')
  @ApiMessage('Perfil de usuario obtenido correctamente')
  findByAccountId(@GetAccount('accountId', ParseUUIDPipe) accountId: string) {
    return this.findUserByAccountUseCase.run(accountId);
  }
  @Get('/')
  @ApiMessage('Usuarios obtenidos correctamente')
  find(@Query() userQueryDto: UserQueryDto) {
    return this.findUsers.run(userQueryDto);
  }
}
