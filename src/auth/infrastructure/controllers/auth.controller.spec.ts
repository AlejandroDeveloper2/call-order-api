import { Test, TestingModule } from '@nestjs/testing';

/** Controller */
import { AuthController } from './auth.controller';

/** Use cases */
import {
  CreateAccountUseCase,
  LoginUseCase,
  LogoutUseCase,
  ResendCodeUseCase,
  ValidateIdentityUseCase,
} from '../../application/use-cases';

/** DTOs */
import {
  CreateAccountDto,
  LoginDto,
  ResendCodeDto,
  ValidateIdentityDto,
} from '../../application/dto';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-verification-code-id'),
}));

describe('AuthController', () => {
  let controller: AuthController;

  const loginUseCase = {
    run: jest.fn(),
  } satisfies Pick<LoginUseCase, 'run'>;

  const validateIdentityUseCase = {
    run: jest.fn(),
  } satisfies Pick<ValidateIdentityUseCase, 'run'>;

  const createAccountUseCase = {
    run: jest.fn(),
  } satisfies Pick<CreateAccountUseCase, 'run'>;

  const resendCodeUseCase = {
    run: jest.fn(),
  } satisfies Pick<ResendCodeUseCase, 'run'>;

  const logoutUseCase = {
    run: jest.fn(),
  } satisfies Pick<LogoutUseCase, 'run'>;

  /** Mock de Response de Express para simular el manejo de cookies */
  const mockRes = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as unknown as import('express').Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginUseCase,
          useValue: loginUseCase,
        },
        {
          provide: ValidateIdentityUseCase,
          useValue: validateIdentityUseCase,
        },
        {
          provide: CreateAccountUseCase,
          useValue: createAccountUseCase,
        },
        {
          provide: ResendCodeUseCase,
          useValue: resendCodeUseCase,
        },
        {
          provide: LogoutUseCase,
          useValue: logoutUseCase,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('debe estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('postLogin', () => {
    it('debe delegar las credenciales al LoginUseCase y retornar su resultado', async () => {
      // Arrange
      const dto: LoginDto = {
        email: 'alejo@gmail.com',
        password: 'Alejo123@',
      };

      const expectedResult = 'test-account-id';

      loginUseCase.run.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.postLogin(dto);

      // Assert
      expect(loginUseCase.run).toHaveBeenCalledTimes(1);
      expect(loginUseCase.run).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('postValidateAccount', () => {
    it('debe delegar los datos al ValidateIdentityUseCase, setear la cookie y retornar los tokens', async () => {
      // Arrange
      const dto: ValidateIdentityDto = {
        verificationCode: '123456',
        accountId: 'test-account-id',
      };

      const expectedResult = {
        token: 'test-token',
        refreshToken: 'test-refresh-token',
      };

      validateIdentityUseCase.run.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.postValidateAccount(mockRes, dto);

      // Assert
      expect(validateIdentityUseCase.run).toHaveBeenCalledTimes(1);
      expect(validateIdentityUseCase.run).toHaveBeenCalledWith(dto);

      expect(mockRes.cookie).toHaveBeenCalledTimes(1);
      expect(mockRes.cookie).toHaveBeenCalledWith(
        'refresh_token',
        expectedResult.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
        }),
      );

      expect(result).toEqual(expectedResult);
    });
  });

  describe('postCreateAccount', () => {
    it('debe delegar los datos al CreateAccountUseCase y retornar su resultado', async () => {
      // Arrange
      const dto: CreateAccountDto = {
        email: 'diego@gmail.com',
        password: 'Diego123@',
        fullname: 'Diego Diaz',
        phone: '3105073199',
        roleId: 'role-test-id',
      };

      const expectedResult = undefined;

      createAccountUseCase.run.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.postCreateAccount(dto);

      // Assert
      expect(createAccountUseCase.run).toHaveBeenCalledTimes(1);
      expect(createAccountUseCase.run).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('postResendCode', () => {
    it('debe delegar los datos al ResendCodeUseCase y retornar su resultado', async () => {
      // Arrange
      const dto: ResendCodeDto = {
        accountId: 'test-account-id',
        email: 'test@gmail.com',
        expiredCode: '123456',
      };

      const expectedResult = undefined;

      resendCodeUseCase.run.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.postResendCode(dto);

      // Assert
      expect(resendCodeUseCase.run).toHaveBeenCalledTimes(1);
      expect(resendCodeUseCase.run).toHaveBeenCalledWith(dto);
      expect(result).toBe(expectedResult);
    });
  });

  describe('postLogout', () => {
    it('debe delegar los datos al LogoutUseCase, limpiar la cookie y retornar su resultado', async () => {
      // Arrange
      const accountId = 'test-account-id';
      const token = 'test-token';

      const expectedResult = undefined;

      logoutUseCase.run.mockResolvedValue(expectedResult);

      // Act
      const result = await controller.postLogout(mockRes, token, accountId);

      // Assert
      expect(logoutUseCase.run).toHaveBeenCalledTimes(1);
      expect(logoutUseCase.run).toHaveBeenCalledWith(accountId, token);

      expect(mockRes.clearCookie).toHaveBeenCalledTimes(1);
      expect(mockRes.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        expect.objectContaining({
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          path: '/',
        }),
      );

      expect(result).toBe(expectedResult);
    });
  });
});
