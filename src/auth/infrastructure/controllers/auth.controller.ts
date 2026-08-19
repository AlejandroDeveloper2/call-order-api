import { Body, Controller, ParseUUIDPipe, Post, Res } from '@nestjs/common';
import type { Response } from 'express';

/** Casos de uso */
import {
  CreateAccountUseCase,
  LoginUseCase,
  LogoutUseCase,
  ResendCodeUseCase,
  ValidateIdentityUseCase,
} from '../../application/use-cases';

/** Dtos */
import {
  CreateAccountDto,
  LoginDto,
  ResendCodeDto,
  ValidateIdentityDto,
} from '../../application/dto';

/** Decoradores */
import {
  ApiMessage,
  BearerToken,
  Cookie,
  GetAccount,
} from '../../../shared/infrastructure/decorators';
import { Auth } from '../decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly validateAccountUseCase: ValidateIdentityUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly resendCodeUseCase: ResendCodeUseCase,
    private readonly logoutUseCase: LogoutUseCase,
  ) {}

  @Post('/login')
  @ApiMessage('Credenciales verificadas correctamente')
  postLogin(@Body() loginDto: LoginDto) {
    return this.loginUseCase.run(loginDto);
  }

  @Post('/validate')
  @ApiMessage('Identidad verificada con éxito')
  async postValidateAccount(
    @Res({ passthrough: true }) res: Response,
    @Body() validateIdentityDto: ValidateIdentityDto,
  ) {
    const { refreshToken, token } =
      await this.validateAccountUseCase.run(validateIdentityDto);

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 semana
    });

    return { token, refreshToken };
  }

  @Post('/register')
  @Auth('auth:create:account')
  @ApiMessage('Cuenta creada con éxito')
  postCreateAccount(@Body() createAccountDto: CreateAccountDto) {
    return this.createAccountUseCase.run(createAccountDto);
  }

  @Post('/resend/code')
  @ApiMessage('Código reenviado con éxito')
  postResendCode(@Body() resendCodeDto: ResendCodeDto) {
    return this.resendCodeUseCase.run(resendCodeDto);
  }

  @Post('/logout')
  @ApiMessage('Sesión cerrada con éxito')
  async postLogout(
    @Res({ passthrough: true }) res: Response,
    @BearerToken() token: string,
    @GetAccount('accountId', ParseUUIDPipe) accountId: string,
  ) {
    await this.logoutUseCase.run(accountId, token);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
    });

    return undefined;
  }
}
