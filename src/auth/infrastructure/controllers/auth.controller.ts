import { Body, Controller, Post } from '@nestjs/common';

/** Casos de uso */
import {
  LoginUseCase,
  ValidateIdentityUseCase,
} from '../../application/use-cases';

/** Dtos */
import { LoginDto, ValidateIdentityDto } from '../../application/dto';

/** Decoradores */
import { ApiMessage } from '../../../shared/infrastructure/decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly validateAccountUseCase: ValidateIdentityUseCase,
  ) {}

  @Post('/login')
  @ApiMessage('Credenciales verificadas correctamente')
  postLogin(@Body() loginDto: LoginDto) {
    return this.loginUseCase.run(loginDto);
  }

  @Post('/validate')
  @ApiMessage('Identidad verificada con éxito')
  postValidateAccount(@Body() validateIdentityDto: ValidateIdentityDto) {
    return this.validateAccountUseCase.run(validateIdentityDto);
  }
}
