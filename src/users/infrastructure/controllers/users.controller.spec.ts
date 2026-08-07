import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../../domain/entities';

import {
  FindUserByAccountUseCase,
  FindUsersUseCase,
  UpdateProfileUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';
import { UserQueryDto, UpdateUserStatusDto } from '../../application/dto';

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
  const expectedPaginatedList = {
    records: [expectedUser],
    page: 1,
    totalPages: 1,
    totalRecords: 1,
  };

  const mockFindUserByAccountUseCase = {
    run: jest.fn().mockResolvedValue({
      data: expectedUser,
      message: 'Perfil de usuario obtenido correctamente',
      httpCode: 200,
    }),
  };

  const mockFindUsersUseCase = {
    run: jest.fn().mockResolvedValue({
      data: expectedPaginatedList,
      message: 'Usuarios obtenidos correctamente',
      httpCode: 200,
    }),
  };

  const mockUpdateProfileUseCase = {
    run: jest.fn().mockResolvedValue({
      data: null,
      message: 'Perfil de usuario actualizado correctamente',
      httpCode: 200,
    }),
  };

  const mockUpdateUserStatusUseCase = {
    run: jest.fn().mockResolvedValue({
      data: null,
      message: 'Estado del usuario actualizado correctamente',
      httpCode: 200,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: FindUserByAccountUseCase,
          useValue: mockFindUserByAccountUseCase,
        },
        { provide: FindUsersUseCase, useValue: mockFindUsersUseCase },
        { provide: UpdateProfileUseCase, useValue: mockUpdateProfileUseCase },
        {
          provide: UpdateUserStatusUseCase,
          useValue: mockUpdateUserStatusUseCase,
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

  it('deberia devolver un listado paginado de usuarios segun una query', async () => {
    const query: UserQueryDto = {};

    await expect(controller.find(query)).resolves.toEqual({
      data: expectedPaginatedList,
      message: 'Usuarios obtenidos correctamente',
      httpCode: 200,
    });
  });

  it('deberia actualizar el perfil de un usuario que corresponde a un determinado id', async () => {
    const profileId = 'test-user-id';
    const profileToUpdate = {
      fullname: 'Luis Casas',
      phone: '3154667899',
    };
    await expect(
      controller.update(profileId, profileToUpdate),
    ).resolves.toEqual({
      data: null,
      message: 'Perfil de usuario actualizado correctamente',
      httpCode: 200,
    });
  });

  it('deberia actualizar el estado de un perfil de usuario que corresponde a un determinado id', async () => {
    const profileId = 'test-user-id';
    const statusToUpdate1: UpdateUserStatusDto = { status: 'active' };
    const statusToUpdate2: UpdateUserStatusDto = { status: 'inactive' };

    await expect(
      controller.updateStatus(profileId, statusToUpdate1),
    ).resolves.toEqual({
      data: null,
      message: 'Estado del usuario actualizado correctamente',
      httpCode: 200,
    });

    await expect(
      controller.updateStatus(profileId, statusToUpdate2),
    ).resolves.toEqual({
      data: null,
      message: 'Estado del usuario actualizado correctamente',
      httpCode: 200,
    });
  });
});
