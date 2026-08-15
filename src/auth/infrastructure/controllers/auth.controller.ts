import { Body, Controller, Post } from '@nestjs/common';

/** Casos de uso */
import {
  CreateAccountUseCase,
  LoginUseCase,
  ValidateIdentityUseCase,
} from '../../application/use-cases';

/** Dtos */
import {
  CreateAccountDto,
  LoginDto,
  ValidateIdentityDto,
} from '../../application/dto';

/** Decoradores */
import { ApiMessage } from '../../../shared/infrastructure/decorators';
import { Auth } from '../decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly validateAccountUseCase: ValidateIdentityUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
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

  @Post('/register')
  @Auth('auth:create:account')
  @ApiMessage('Cuenta creada con éxito')
  postCreateAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.createAccountUseCase.run(createAccountDto);
  }
}
