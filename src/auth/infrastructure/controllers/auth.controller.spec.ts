import { Test, TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller';

import { LoginUseCase } from '../../application/use-cases/login/login.usecase';

jest.mock('uuid', () => ({
  v4: () => 'test-code-id',
}));

describe('AuthController', () => {
  let controller: AuthController;

  const mockLoginUseCase = {
    run: jest.fn().mockResolvedValue({
      data: null,
      message: 'Inicio de sesión correcto',
      httpCode: 200,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: LoginUseCase, useValue: mockLoginUseCase }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
