import { Body, Controller, Get, ParseUUIDPipe } from '@nestjs/common';

import { FindUserByAccountUseCase } from '../../application/use-cases';

import {
  ApiMessage,
  GetAccount,
} from '../../../shared/infrastructure/decorators';

@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByAccountUseCase: FindUserByAccountUseCase,
  ) {}

  @Get('/account')
  @ApiMessage('Perfil de usuario obtenido correctamente')
  async findByAccountId(
    @GetAccount('accountId', ParseUUIDPipe) accountId: string,
  ) {
    return await this.findUserByAccountUseCase.run(accountId);
  }
}
