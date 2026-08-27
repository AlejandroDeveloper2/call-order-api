import {
  Body,
  Controller,
  Get,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';

/** Casos de uso */
import {
  ChangePasswordUseCase,
  CreateAccountUseCase,
  FindAccountsUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshSessionUseCase,
  ResendCodeUseCase,
  UpdateEmailUseCase,
  UpdatePasswordUseCase,
  ValidateIdentityUseCase,
  ValidateSessionUseCase,
} from '../../application/use-cases';

/** Dtos Http */
import {
  ChangePasswordDto,
  CreateAccountDto,
  FindAccountsQueryDto,
  LoginDto,
  ResendCodeDto,
  UpdateEmailDto,
  UpdatePasswordDto,
  ValidateIdentityDto,
} from '../dto';

/** Decoradores */
import { Auth, BearerToken, Cookie, GetAccount } from '../decorators';
import { ApiMessage } from '../../../shared/infrastructure/decorators';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly findAccountsUsecase: FindAccountsUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly validateIdentityUseCase: ValidateIdentityUseCase,
    private readonly createAccountUseCase: CreateAccountUseCase,
    private readonly resendCodeUseCase: ResendCodeUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly refreshSessionUseCase: RefreshSessionUseCase,
    private readonly validateSessionUseCase: ValidateSessionUseCase,
    private readonly updateEmailUseCase: UpdateEmailUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
  ) {}

  @Get('/accounts')
  @Auth('auth:read:all')
  @ApiMessage('Cuentas obtenidas correctamente')
  getAccounts(@Query() findAccountsQueryDto: FindAccountsQueryDto) {
    return this.findAccountsUsecase.run(findAccountsQueryDto);
  }

  @Post('/login')
  @ApiMessage('Credenciales verificadas correctamente')
  postLogin(@Body() loginDto: LoginDto) {
    return this.loginUseCase.run(loginDto);
  }

  @Post('/validate')
  @ApiMessage('Identidad verificada con éxito')
  async postValidateIdentity(
    @Res({ passthrough: true }) res: Response,
    @Body() validateIdentityDto: ValidateIdentityDto,
  ) {
    const { refreshToken, token } =
      await this.validateIdentityUseCase.run(validateIdentityDto);

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
  // @Auth('auth:create:account')
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
  @Auth()
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

  @Post('/refresh')
  @Auth()
  @ApiMessage('Sesión actualizada con éxito')
  async postRefreshSession(
    @Res({ passthrough: true }) res: Response,
    @BearerToken() oldToken: string,
    @Cookie() oldRefreshToken: string,
    @GetAccount('accountId', ParseUUIDPipe) accountId: string,
  ) {
    const { token, refreshToken } = await this.refreshSessionUseCase.run(
      accountId,
      oldToken,
      oldRefreshToken,
    );

    res.cookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 1 semana
    });

    return { token, refreshToken };
  }

  @Get('/validate/session')
  @Auth()
  @ApiMessage('Sesión verificada con éxito')
  getValidateSession(
    @BearerToken() token: string,
    @GetAccount('accountId', ParseUUIDPipe) accountId: string,
  ) {
    return this.validateSessionUseCase.run(accountId, token);
  }

  @Patch('/update/email')
  @Auth('auth:update:email')
  @ApiMessage('Correo electrónico actualizado con éxito')
  patchEmail(
    @GetAccount('accountId') accountId: string,
    @Body() updateEmailDto: UpdateEmailDto,
  ) {
    return this.updateEmailUseCase.run(accountId, updateEmailDto);
  }
  @Patch('/change/password')
  @Auth('auth:change:password')
  @ApiMessage('Contraseña fue cambiada con éxito')
  patchChangePassword(
    @GetAccount('accountId') accountId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.changePasswordUseCase.run(accountId, changePasswordDto);
  }
  @Patch('/update/password')
  @Auth('auth:update:password')
  @ApiMessage('Contraseña fue actualizada con éxito')
  patchUpdatePassword(
    @GetAccount('accountId') accountId: string,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.updatePasswordUseCase.run(accountId, updatePasswordDto);
  }
}
