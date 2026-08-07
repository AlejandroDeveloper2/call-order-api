import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Patch,
  Query,
} from '@nestjs/common';

/** Casos de uso */
import {
  FindUserByAccountUseCase,
  FindUsersUseCase,
  UpdateProfileUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';

/** Decoradores */
import {
  ApiMessage,
  GetAccount,
} from '../../../shared/infrastructure/decorators';
/** Dtos */
import {
  UpdateUserDto,
  UpdateUserStatusDto,
  UserQueryDto,
} from '../../application/dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByAccountUseCase: FindUserByAccountUseCase,
    private readonly findUsersUseCase: FindUsersUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
  ) {}

  @Get('/account')
  @ApiMessage('Perfil de usuario obtenido correctamente')
  findByAccountId(@GetAccount('accountId', ParseUUIDPipe) accountId: string) {
    return this.findUserByAccountUseCase.run(accountId);
  }
  @Get('/')
  @ApiMessage('Usuarios obtenidos correctamente')
  find(@Query() userQueryDto: UserQueryDto) {
    return this.findUsersUseCase.run(userQueryDto);
  }
  @Patch('/')
  @ApiMessage('Perfil de usuario actualizado correctamente')
  update(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.updateProfileUseCase.run(profileId, updateUserDto);
  }

  @Patch('/status')
  @ApiMessage('Estado del usuario actualizado correctamente')
  updateStatus(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.updateUserStatusUseCase.run(profileId, updateUserStatusDto);
  }
}
