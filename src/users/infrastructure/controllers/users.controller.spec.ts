import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../../domain/entities';

import {
  FindUserByAccountUseCase,
  FindUsersUseCase,
  UpdateProfileUseCase,
  UpdateUserAvatarUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';
import { UserQueryDto, UpdateUserStatusDto } from '../../application/dto';

import { UsersController } from './users.controller';
import { CloudinaryAdpater } from '../../../shared/infrastructure/adapters';

// SharedModule removed to keep unit test isolated from global providers

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
      passwordHash: 'hash',
      mustChangePassword: false,
      lastLoginAt: new Date(),
      failedAttempts: 0,
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

  const mockUpdateUserAvatarUseCase = {
    run: jest.fn().mockResolvedValue({
      data: null,
      message: 'Avatar actualizado correctamente',
      httpCode: 200,
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: CloudinaryAdpater,
          useValue: {
            uploadFile: jest
              .fn()
              .mockResolvedValue({ secure_url: 'avatar-url' }),
          },
        },
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
        {
          provide: UpdateUserAvatarUseCase,
          useValue: mockUpdateUserAvatarUseCase,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('deberia devolver el perfil del usuario que coincida con el accountId', async () => {
    const accountId: string = 'test-account-id';

    await expect(controller.getByAccountId(accountId)).resolves.toEqual({
      data: expectedUser,
      message: 'Perfil de usuario obtenido correctamente',
      httpCode: 200,
    });
    expect(mockFindUserByAccountUseCase.run).toHaveBeenCalledWith(accountId);
  });

  it('deberia devolver un listado paginado de usuarios segun una query', async () => {
    const query: UserQueryDto = {};

    await expect(controller.getUsers(query)).resolves.toEqual({
      data: expectedPaginatedList,
      message: 'Usuarios obtenidos correctamente',
      httpCode: 200,
    });
    expect(mockFindUsersUseCase.run).toHaveBeenCalledWith(query);
  });

  it('deberia actualizar el perfil de un usuario que corresponde a un determinado id', async () => {
    const profileId = 'test-user-id';
    const profileToUpdate = {
      fullname: 'Luis Casas',
      phone: '3154667899',
    };
    await expect(
      controller.patchProfile(profileId, profileToUpdate),
    ).resolves.toEqual({
      data: null,
      message: 'Perfil de usuario actualizado correctamente',
      httpCode: 200,
    });
    expect(mockUpdateProfileUseCase.run).toHaveBeenCalledWith(
      profileId,
      profileToUpdate,
    );
  });

  it('deberia actualizar el estado de un perfil de usuario que corresponde a un determinado id', async () => {
    const profileId = 'test-user-id';
    const statusToUpdate1: UpdateUserStatusDto = { status: 'active' };
    const statusToUpdate2: UpdateUserStatusDto = { status: 'inactive' };

    await expect(
      controller.patchUserStatus(profileId, statusToUpdate1),
    ).resolves.toEqual({
      data: null,
      message: 'Estado del usuario actualizado correctamente',
      httpCode: 200,
    });
    expect(mockUpdateUserStatusUseCase.run).toHaveBeenCalledWith(
      profileId,
      statusToUpdate1,
    );

    await expect(
      controller.patchUserStatus(profileId, statusToUpdate2),
    ).resolves.toEqual({
      data: null,
      message: 'Estado del usuario actualizado correctamente',
      httpCode: 200,
    });
    expect(mockUpdateUserStatusUseCase.run).toHaveBeenCalledWith(
      profileId,
      statusToUpdate2,
    );
  });

  it('deberia actualizar el avatar del usuario', async () => {
    const profileId = 'test-user-id';
    const avatarUrl = 'avatar-url';

    await expect(
      controller.patchUserAvatar(profileId, avatarUrl),
    ).resolves.toEqual({
      data: null,
      message: 'Avatar actualizado correctamente',
      httpCode: 200,
    });
    expect(mockUpdateUserAvatarUseCase.run).toHaveBeenCalledWith(
      profileId,
      avatarUrl,
    );
  });
});
