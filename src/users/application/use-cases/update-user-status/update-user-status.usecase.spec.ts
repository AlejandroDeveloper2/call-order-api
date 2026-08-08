import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Excepciones de dominio */
import { AppError } from '../../../../shared/domain/exceptions';

/** Dtos */
import { UpdateUserStatusDto } from '../../dto';
/** Caso de uso */
import { UpdateUserStatusUseCase } from './update-user-status.usecase';

jest.mock('uuid', () => ({
  v4: () => 'test-user-id',
}));

describe('UpdateUserStatusUseCase', () => {
  let useCase: UpdateUserStatusUseCase;

  const userRepository = {
    activate: jest.fn(),
    deactivate: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'activate' | 'deactivate'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserStatusUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
      ],
    }).compile();

    useCase = module.get(UpdateUserStatusUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil no existe en el caso de activación del perfil', async () => {
      const profileId = 'test-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'active',
      };

      userRepository.activate.mockResolvedValue(0);

      await expect(useCase.run(profileId, dto)).rejects.toBeInstanceOf(
        AppError,
      );

      expect(userRepository.activate).toHaveBeenCalledWith(profileId);
      expect(userRepository.deactivate).not.toHaveBeenCalled();
    });

    it('debe lanzar AppError cuando el perfil no existe en el caso de desactivación del perfil', async () => {
      const profileId = 'test-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'inactive',
      };

      userRepository.deactivate.mockResolvedValue(0);

      await expect(useCase.run(profileId, dto)).rejects.toBeInstanceOf(
        AppError,
      );

      expect(userRepository.deactivate).toHaveBeenCalledWith(profileId);
      expect(userRepository.activate).not.toHaveBeenCalled();
    });

    it('debe actualizar el estado de un perfil de usuario a `activo` cuando este existe', async () => {
      const profileId = 'test-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'active',
      };

      userRepository.activate.mockResolvedValue(1);

      await expect(useCase.run(profileId, dto)).resolves.toBeUndefined();

      expect(userRepository.activate).toHaveBeenCalledTimes(1);

      expect(userRepository.activate).toHaveBeenCalledWith(profileId);
    });

    it('debe actualizar el estado de un perfil de usuario a `inactivo` cuando este existe', async () => {
      const profileId = 'test-user-id';
      const dto: UpdateUserStatusDto = {
        status: 'inactive',
      };

      userRepository.deactivate.mockResolvedValue(1);

      await expect(useCase.run(profileId, dto)).resolves.toBeUndefined();

      expect(userRepository.deactivate).toHaveBeenCalledTimes(1);

      expect(userRepository.deactivate).toHaveBeenCalledWith(profileId);
    });
  });
});
