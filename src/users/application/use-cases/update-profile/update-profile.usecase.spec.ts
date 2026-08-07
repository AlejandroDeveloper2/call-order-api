import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de dominio */
import { AppError } from '../../../../shared/domain/exceptions';

/** Dtos */
import { UpdateUserDto } from '../../dto';
/** Caso de uso */
import { UpdateProfileUseCase } from './update-profile.usecase';

jest.mock('uuid', () => ({
  v4: () => 'test-user-id',
}));

describe('UpdateProfileUseCase', () => {
  let useCase: UpdateProfileUseCase;

  const userRepository = {
    update: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'update'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateProfileUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateProfileUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil no existe', async () => {
      const profileId = 'test-user-id';
      const dto: UpdateUserDto = {
        fullname: 'Juan Pérez',
        phone: '3001234567',
      };

      userRepository.update.mockResolvedValue(0);

      await expect(useCase.run(profileId, dto)).rejects.toBeInstanceOf(
        AppError,
      );

      expect(userRepository.update).toHaveBeenCalledWith(profileId, dto);
    });

    it('debe actualizar un perfil de usuario cuando este existe', async () => {
      const profileId = 'test-user-id';
      const dto: UpdateUserDto = {
        fullname: 'Juan Pérez',
        phone: '3001234567',
      };

      userRepository.update.mockResolvedValue(undefined);

      await expect(useCase.run(profileId, dto)).resolves.toBeUndefined();

      expect(userRepository.update).toHaveBeenCalledWith(
        profileId,
        expect.objectContaining<UpdateUserDto>(dto),
      );
    });
  });
});
