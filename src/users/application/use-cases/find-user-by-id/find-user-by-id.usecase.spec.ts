import { Test, TestingModule } from '@nestjs/testing';

/** Excepciones de dominio */
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindUserByIdUseCase } from './find-user-by-id.usecase';

/** utilidades */
import { buildProfile } from '../../../../shared/application/utils/domain-class-contructor';

describe('FindUserByIdUseCase', () => {
  let useCase: FindUserByIdUseCase;

  const mockUserRepository = {
    findById: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'findById'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserByIdUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindUserByIdUseCase);

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil de usuario no existe', async () => {
      //Arrange
      const profileId: string = 'wrong-profile-id';

      mockUserRepository.findById.mockResolvedValue(null);

      //Act
      const profile = useCase.run(profileId);

      //Assert
      await expect(profile).rejects.toMatchObject({
        name: USER_ERROR_CODES.userNotFound,
        httpCode: 404,
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith(profileId);
    });

    it('debe traer un usuario cuando el profileId corresponde a un usuario registrado', async () => {
      //Arrange
      const profileId: string = 'test-profile-id';

      const expectedProfile = buildProfile();

      mockUserRepository.findById.mockResolvedValue(expectedProfile);

      //Act
      const profile = await useCase.run(profileId);

      //Assert
      expect(profile).toBe(expectedProfile);

      expect(mockUserRepository.findById).toHaveBeenCalledWith(profileId);
    });
  });
});
