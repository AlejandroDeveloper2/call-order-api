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
import { Auth } from '../../../auth/infrastructure/decorators';

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
  @Auth('users:read:profile')
  @ApiMessage('Perfil de usuario obtenido correctamente')
  getByAccountId(@GetAccount('accountId', ParseUUIDPipe) accountId: string) {
    return this.findUserByAccountUseCase.run(accountId);
  }
  @Get('/')
  @Auth('users:read:all')
  @ApiMessage('Usuarios obtenidos correctamente')
  getUsers(@Query() userQueryDto: UserQueryDto) {
    return this.findUsersUseCase.run(userQueryDto);
  }
  @Patch('/')
  @Auth('users:update:profile')
  @ApiMessage('Perfil de usuario actualizado correctamente')
  patchProfile(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.updateProfileUseCase.run(profileId, updateUserDto);
  }

  @Patch('/avatar')
  @Auth('users:update:avatar')
  @ApiMessage('Avatar actualizado correctamente')
  @UploadAvatar()
  patchUserAvatar(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @AvatarUrl() fileUrl: string,
  ) {
    return this.updateUserAvatarUseCase.run(profileId, fileUrl);
  }

  @Patch('/status')
  @Auth('users:update:status')
  @ApiMessage('Estado del usuario actualizado correctamente')
  patchUserStatus(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @Body() updateUserStatusDto: UpdateUserStatusDto,
  ) {
    return this.updateUserStatusUseCase.run(profileId, updateUserStatusDto);
  }
}
