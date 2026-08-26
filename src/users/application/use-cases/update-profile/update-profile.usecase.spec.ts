import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de dominio */
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

/** Dtos */
import { UpdateUserDto } from '../../../infrastructure/dto';
/** Caso de uso */
import { UpdateProfileUseCase } from './update-profile.usecase';

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;

  const mockUserRepository = {
    update: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'update'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateProfileUseCase);

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil no existe', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';
      const dto: UpdateUserDto = {
        fullname: 'Juan Pérez',
        phone: '3001234567',
      };

      mockUserRepository.update.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, dto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: USER_ERROR_CODES.userNotFound,
        httpCode: 404,
      });

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        wrongProfileId,
        expect.objectContaining(dto),
      );
    });

    it('debe actualizar un perfil de usuario cuando este existe', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const dto: UpdateUserDto = {
        fullname: 'Juan Pérez',
        phone: '3001234567',
      };

      mockUserRepository.update.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, dto);

      //Assert
      expect(result).toBeUndefined();

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining(dto),
      );
    });
  });
});
