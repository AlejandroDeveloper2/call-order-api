import { Body, Controller, Get, ParseUUIDPipe, Patch } from '@nestjs/common';

/** Casos de uso */
import {
  FindUserByIdUseCase,
  UpdateProfileUseCase,
  UpdateUserAvatarUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';

/** Decoradores */
import {
  ApiMessage,
  ImageUrl,
  UploadImage,
} from '../../../shared/infrastructure/decorators';
import { Auth, GetAccount } from '../../../auth/infrastructure/decorators';

/** Dtos HTTP */
import { UpdateUserDto, UpdateUserStatusDto } from '../dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updateUserStatusUseCase: UpdateUserStatusUseCase,
    private readonly updateUserAvatarUseCase: UpdateUserAvatarUseCase,
  ) {}

  @Get('/profile')
  @Auth('users:read:profile')
  @ApiMessage('Perfil de usuario obtenido correctamente')
  getUserById(@GetAccount('profileId', ParseUUIDPipe) profileId: string) {
    return this.findUserByIdUseCase.run(profileId);
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
  @UploadImage()
  patchUserAvatar(
    @GetAccount('profileId', ParseUUIDPipe) profileId: string,
    @ImageUrl() fileUrl: string,
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
