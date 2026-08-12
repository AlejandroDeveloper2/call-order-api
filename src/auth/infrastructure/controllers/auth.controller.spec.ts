import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';

import {
  LoginUseCase,
  ValidateIdentityUseCase,
} from '../../application/use-cases';

import { LoginDto, ValidateIdentityDto } from '../../application/dto';

jest.mock('uuid', () => ({
  v4: () => 'test-code-id',
}));

describe('AuthController', () => {
  let controller: AuthController;

  const mockLoginUseCase = {
    run: jest.fn().mockResolvedValue({
      data: 'test-account-id',
      message: 'Credenciales verificadas correctamente',
      httpCode: 200,
    }),
  };

  const mockValidateIdentityUseCase = {
    run: jest.fn().mockResolvedValue({
      data: { token: 'test-token', refreshToken: 'test-refresh-token' },
      message: 'Identidad verificada con éxito',
      httpCode: 200,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        {
          provide: ValidateIdentityUseCase,
          useValue: mockValidateIdentityUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('Deberia estar definido el controlador de auth', () => {
    expect(controller).toBeDefined();
  });

  it('deberia verificar las credenciales de un usuario, enviar un código de verificación al correo ingresado y devolver el ID de la cuenta asociada', async () => {
    const loginDto: LoginDto = {
      email: 'alejo@gmail.com',
      password: 'Alejo123@',
    };

    await expect(controller.postLogin(loginDto)).resolves.toEqual({
      data: 'test-account-id',
      message: 'Credenciales verificadas correctamente',
      httpCode: 200,
    });
    expect(mockLoginUseCase.run).toHaveBeenCalledWith(loginDto);
  });

  it('deberia validar la identidad de un usuario que esta intentando loguearse y devolver el token y refresh token', async () => {
    const validateIdentityDto: ValidateIdentityDto = {
      verificationCode: '123456',
      accountId: 'test-account-id',
    };

    await expect(
      controller.postValidateAccount(validateIdentityDto),
    ).resolves.toEqual({
      data: { token: 'test-token', refreshToken: 'test-refresh-token' },
      message: 'Identidad verificada con éxito',
      httpCode: 200,
    });

    expect(mockValidateIdentityUseCase.run).toHaveBeenCalledWith(
      validateIdentityDto,
    );
  });
});
