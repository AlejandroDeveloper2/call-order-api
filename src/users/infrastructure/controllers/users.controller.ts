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
  UpdateUserAvatarUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';

/** Decoradores */
import {
  ApiMessage,
  AvatarUrl,
  GetAccount,
  UploadAvatar,
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
    private readonly updateUserAvatarUseCase: UpdateUserAvatarUseCase,
  ) {}

  @Get('/account')
  @ApiMessage('Perfil de usuario obtenido correctamente')
  getByAccountId(@GetAccount('accountId', ParseUUIDPipe) accountId: string) {
    return this.findUserByAccountUseCase.run(accountId);
  }
  @Get('/')
  @ApiMessage('Usuarios obtenidos correctamente')
  getUsers(@Query() userQueryDto: UserQueryDto) {
    return this.findUsersUseCase.run(userQueryDto);
  }
  @Patch('/')
  @ApiMessage('Perfil de usuario actualizado correctamente')
  patchProfile(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.updateProfileUseCase.run(profileId, updateUserDto);
  }

  @Patch('/avatar')
  @ApiMessage('Avatar actualizado correctamente')
  @UploadAvatar()
  patchUserAvatar(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @AvatarUrl() fileUrl: string,
  ) {
    return this.updateUserAvatarUseCase.run(profileId, fileUrl);
  }

  @Patch('/status')
  @ApiMessage('Estado del usuario actualizado correctamente')
  patchUserStatus(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.updateUserStatusUseCase.run(profileId, updateUserStatusDto);
  }
}
