import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';
/** Entidades de dominio */
import { User } from '../../../domain/entities';

/** Dtos */
import { CreateUserDto } from '../../dto/create-user.dto';
/** Caso de uso */
import { CreateUserUseCase } from './create-user.usecase';

jest.mock('uuid', () => ({
  v4: () => 'test-user-id',
}));

describe('CreateUserUseCase', () => {
  let useCase: CreateUserUseCase;

  const userRepository = {
    create: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'create'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
      ],
    }).compile();

    useCase = module.get(CreateUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    // it('debe lanzar AppError cuando el rol no existe', async () => {
    //   const dto: CreateUserDto = {
    //     accountId: 'account-1',
    //     roleId: 'role-1',
    //     fullname: 'Juan Pérez',
    //     phone: '3001234567',
    //   };

    //   roleRepository.findById.mockResolvedValue(null);

    //   await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);

    //   expect(roleRepository.findById).toHaveBeenCalledWith(dto.roleId);
    //   expect(userRepository.create).not.toHaveBeenCalled();
    // });

    it('debe crear un perfil de usuario', async () => {
      const dto: CreateUserDto = {
        accountId: 'account-1',
        roleId: 'role-1',
        fullname: 'Juan Pérez',
        phone: '3001234567',
      };

      userRepository.create.mockResolvedValue(undefined);

      await expect(useCase.run(dto)).resolves.toBeUndefined();

      expect(userRepository.create).toHaveBeenCalledTimes(1);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining<User>(
          new User(
            'test-user-id',
            dto.fullname,
            dto.accountId,
            dto.roleId,
            undefined,
            dto.phone,
          ),
        ),
      );
    });
  });
});
