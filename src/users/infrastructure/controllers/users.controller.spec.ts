import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../../domain/entities';

import {
  FindUserByIdUseCase,
  FindUsersUseCase,
  UpdateProfileUseCase,
  UpdateUserAvatarUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';
import { UserQueryDto, UpdateUserStatusDto, UpdateUserDto } from '../dto';

import { UsersController } from './users.controller';
import { CloudinaryAdpater } from '../../../shared/infrastructure/adapters';

describe('UsersController', () => {
  let controller: UsersController;

  const mockFindUserByIdUseCase = {
    run: jest.fn(),
  } satisfies Pick<FindUserByIdUseCase, 'run'>;

  const mockFindUsersUseCase = {
    run: jest.fn(),
  } satisfies Pick<FindUsersUseCase, 'run'>;

  const mockUpdateProfileUseCase = {
    run: jest.fn(),
  } satisfies Pick<UpdateProfileUseCase, 'run'>;

  const mockUpdateUserStatusUseCase = {
    run: jest.fn(),
  } satisfies Pick<UpdateUserStatusUseCase, 'run'>;

  const mockUpdateUserAvatarUseCase = {
    run: jest.fn(),
  } satisfies Pick<UpdateUserAvatarUseCase, 'run'>;

  const mockCloudinaryAdapter = {
    uploadFile: jest.fn(),
  } satisfies Pick<CloudinaryAdpater, 'uploadFile'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: CloudinaryAdpater,
          useValue: mockCloudinaryAdapter,
        },
        {
          provide: FindUserByIdUseCase,
          useValue: mockFindUserByIdUseCase,
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

    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('debe estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('getUserById', () => {
    it('debe delegar los datos al getUserById y retornar su resultado', async () => {
      //Arrange
      const userId: string = 'test-user-id';

      const expectedResult = expect.any(User) as User;

      mockFindUserByIdUseCase.run.mockResolvedValue(expectedResult);

      //Act
      const result = await controller.getUserById(userId);

      //Assert
      expect(mockFindUserByIdUseCase.run).toHaveBeenCalledTimes(1);
      expect(mockFindUserByIdUseCase.run).toHaveBeenCalledWith(userId);
      expect(result).toBe(expectedResult);
    });
  });

  describe('getUsers', () => {
    it('debe delegar los datos al getUsers y retornar su resultado', async () => {
      //Arrange
      const query: UserQueryDto = {};

      const expectedResult = {
        records: expect.any([User]) as User[],
        page: expect.any(Number) as number,
        totalPages: expect.any(Number) as number,
        totalRecords: expect.any(Number) as number,
      };

      mockFindUsersUseCase.run.mockResolvedValue(expectedResult);

      //Act
      const result = await controller.getUsers(query);

      //Assert
      expect(mockFindUsersUseCase.run).toHaveBeenCalledTimes(1);
      expect(mockFindUsersUseCase.run).toHaveBeenCalledWith(query);
      expect(result).toBe(expectedResult);
    });
  });

  describe('patchProfile', () => {
    it('debe delegar los datos al patchProfile y retornar su resultado', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const updateUserDto: UpdateUserDto = {
        fullname: 'Luis Casas',
        phone: '3154667899',
      };

      const expectedResult = undefined;

      mockUpdateProfileUseCase.run.mockResolvedValue(expectedResult);

      //Act
      const result = await controller.patchProfile(profileId, updateUserDto);

      //Assert
      expect(mockUpdateProfileUseCase.run).toHaveBeenCalledTimes(1);
      expect(mockUpdateProfileUseCase.run).toHaveBeenCalledWith(
        profileId,
        updateUserDto,
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe('patchUserStatus', () => {
    it('debe delegar los datos al patchUserStatus y retornar su resultado (Caso activar perfil)', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const updateUserStatusDto: UpdateUserStatusDto = {
        status: 'active',
      };

      const expectedResult = undefined;

      mockUpdateUserStatusUseCase.run.mockResolvedValue(expectedResult);

      //Act
      const result = await controller.patchUserStatus(
        profileId,
        updateUserStatusDto,
      );

      //Assert
      expect(mockUpdateUserStatusUseCase.run).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserStatusUseCase.run).toHaveBeenCalledWith(
        profileId,
        updateUserStatusDto,
      );
      expect(result).toBe(expectedResult);
    });

    it('debe delegar los datos al patchUserStatus y retornar su resultado (Caso inactivar perfil)', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const updateUserStatusDto: UpdateUserStatusDto = {
        status: 'inactive',
      };

      const expectedResult = undefined;

      mockUpdateUserStatusUseCase.run.mockResolvedValue(expectedResult);

      //Act
      const result = await controller.patchUserStatus(
        profileId,
        updateUserStatusDto,
      );

      //Assert
      expect(mockUpdateUserStatusUseCase.run).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserStatusUseCase.run).toHaveBeenCalledWith(
        profileId,
        updateUserStatusDto,
      );
      expect(result).toBe(expectedResult);
    });
  });

  describe('patchUserAvatar', () => {
    it('debe delegar los datos al patchUserAvatar y retornar su resultado', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const avatarUrl = 'avatar-url';

      const expectedResult = undefined;

      mockUpdateUserAvatarUseCase.run.mockResolvedValue(expectedResult);

      //Act
      const result = await controller.patchUserAvatar(profileId, avatarUrl);

      //Assert
      expect(mockUpdateUserAvatarUseCase.run).toHaveBeenCalledTimes(1);
      expect(mockUpdateUserAvatarUseCase.run).toHaveBeenCalledWith(
        profileId,
        avatarUrl,
      );
      expect(result).toBe(expectedResult);
    });
  });
});
