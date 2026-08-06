import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../../domain/entities';

import { FindUserByAccountUseCase } from '../../application/use-cases';

import { UsersController } from './users.controller';

jest.mock('uuid', () => ({
  v4: () => 'test-user-id',
}));

describe('UsersController', () => {
  let controller: UsersController;

  const expectedUser = new User(
    'user-1',
    'Juan Perez',
    'test-account-id',
    'role-1',
    undefined,
    '3105047899',
    true,
    {
      accountId: 'test-account-id',
      email: 'juan@gmail.com',
    },
    { roleId: 'role-1', name: 'Administrador' },
  );

  const mockUseCase = {
    run: jest.fn().mockResolvedValue({
      data: expectedUser,
      message: 'Perfil de usuario obtenido correctamente',
      httpCode: 200,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: FindUserByAccountUseCase,
          useValue: mockUseCase,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('deberia devolver el perfil del usuario que coincida con el accountId', async () => {
    const accountId: string = 'test-account-id';

    await expect(controller.findByAccountId(accountId)).resolves.toEqual({
      data: expectedUser,
      message: 'Perfil de usuario obtenido correctamente',
      httpCode: 200,
    });
  });
});
