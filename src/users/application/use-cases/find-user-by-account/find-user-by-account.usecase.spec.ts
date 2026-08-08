import { Test, TestingModule } from '@nestjs/testing';

/** Excepciones de dominio */
import { AppError } from '../../../../shared/domain/exceptions';
/** Entidad de dominio */
import { User } from '../../../domain/entities';
/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindUserByAccountUseCase } from './find-user-by-account.usecase';

describe('FindUserByAccountUseCase', () => {
  let useCase: FindUserByAccountUseCase;

  const userRepository = {
    findByAccountId: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'findByAccountId'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserByAccountUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindUserByAccountUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil de usuario no existe', async () => {
      const accountId: string = 'test-account-id';

      userRepository.findByAccountId.mockResolvedValue(null);

      await expect(useCase.run(accountId)).rejects.toBeInstanceOf(AppError);

      expect(userRepository.findByAccountId).toHaveBeenCalledWith(accountId);
    });

    it('debe traer un usuario cuando el accountId corresponde a un usuario registrado', async () => {
      const accountId: string = 'test-account-id';

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

      userRepository.findByAccountId.mockResolvedValue(expectedUser);

      await expect(useCase.run(accountId)).resolves.toBe(expectedUser);

      expect(userRepository.findByAccountId).toHaveBeenCalledWith(accountId);
    });
  });
});
