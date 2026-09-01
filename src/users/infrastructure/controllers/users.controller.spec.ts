import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../../domain/entities';

import {
  FindUserByIdUseCase,
  UpdateProfileUseCase,
  UpdateUserAvatarUseCase,
  UpdateUserStatusUseCase,
} from '../../application/use-cases';

import { UpdateUserStatusDto, UpdateUserDto } from '../dto';

import { UsersController } from './users.controller';

import { FILE_UPLOADER } from '../../../shared/domain/ports';

import { CloudinaryUploadInterceptor } from '../../../shared/infrastructure/interceptors';

jest.mock('uuid', () => ({
  v4: jest.fn(() => 'test-user-id'),
}));

describe('UsersController', () => {
  let controller: UsersController;

  const mockFindUserByIdUseCase = {
    run: jest.fn(),
  } satisfies Pick<FindUserByIdUseCase, 'run'>;

  const mockUpdateProfileUseCase = {
    run: jest.fn(),
  } satisfies Pick<UpdateProfileUseCase, 'run'>;

  const mockUpdateUserStatusUseCase = {
    run: jest.fn(),
  } satisfies Pick<UpdateUserStatusUseCase, 'run'>;

  const mockUpdateUserAvatarUseCase = {
    run: jest.fn(),
  } satisfies Pick<UpdateUserAvatarUseCase, 'run'>;

  beforeEach(async () => {
    const mockFileUploader = {
      uploadFile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: FindUserByIdUseCase,
          useValue: mockFindUserByIdUseCase,
        },
        { provide: UpdateProfileUseCase, useValue: mockUpdateProfileUseCase },
        {
          provide: UpdateUserStatusUseCase,
          useValue: mockUpdateUserStatusUseCase,
        },
        {
          provide: UpdateUserAvatarUseCase,
          useValue: mockUpdateUserAvatarUseCase,
        },
        {
          provide: FILE_UPLOADER,
          useValue: mockFileUploader,
        },
        CloudinaryUploadInterceptor,
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
