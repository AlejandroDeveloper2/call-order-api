import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de dominio */
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

/** Dtos */
import { UpdateUserStatusDto } from '../../dto';
/** Caso de uso */
import { UpdateUserStatusUseCase } from './update-user-status.usecase';

describe('UpdateUserStatusUseCase', () => {
  let useCase: UpdateUserStatusUseCase;

  const mockUserRepository = {
    activate: jest.fn(),
    deactivate: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'activate' | 'deactivate'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserStatusUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateUserStatusUseCase);

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil no existe en el caso de activación del perfil', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'active',
      };

      mockUserRepository.activate.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, dto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: USER_ERROR_CODES.userNotFound,
        httpCode: 404,
      });

      expect(mockUserRepository.activate).toHaveBeenCalledWith(wrongProfileId);
      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el perfil no existe en el caso de desactivación del perfil', async () => {
      //Arrange
      const wrongProfileId = 'wrong-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'inactive',
      };

      mockUserRepository.deactivate.mockResolvedValue(0);

      //Act
      const result = useCase.run(wrongProfileId, dto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: USER_ERROR_CODES.userNotFound,
        httpCode: 404,
      });

      expect(mockUserRepository.deactivate).toHaveBeenCalledWith(
        wrongProfileId,
      );
      expect(mockUserRepository.activate).not.toHaveBeenCalled();
    });

    it('debe actualizar el estado de un perfil de usuario a `activo` cuando este existe', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'active',
      };

      mockUserRepository.activate.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, dto);

      //Assert
      expect(result).toBeUndefined();

      expect(mockUserRepository.activate).toHaveBeenCalledTimes(1);

      expect(mockUserRepository.activate).toHaveBeenCalledWith(profileId);

      expect(mockUserRepository.deactivate).not.toHaveBeenCalled();
    });

    it('debe actualizar el estado de un perfil de usuario a `inactivo` cuando este existe', async () => {
      //Arrange
      const profileId = 'test-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'inactive',
      };

      mockUserRepository.deactivate.mockResolvedValue(1);

      //Act
      const result = await useCase.run(profileId, dto);

      //Assert
      expect(result).toBeUndefined();

      expect(mockUserRepository.deactivate).toHaveBeenCalledTimes(1);

      expect(mockUserRepository.deactivate).toHaveBeenCalledWith(profileId);

      expect(mockUserRepository.activate).not.toHaveBeenCalled();
    });
  });
});
