import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import {
  ROLE_REPOSITORY,
  USER_REPOSITORY,
  RoleRepositoryPort,
  UserRepositoryPort,
} from '../../../domain/ports';
/** Entidades de dominio */
import { User } from '../../../domain/entities';
/** Excepciones de dominio */
import { AppError } from '../../../../shared/domain/exceptions';

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
  const roleRepository = {
    findById: jest.fn(),
  } satisfies Pick<RoleRepositoryPort, 'findById'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
        {
          provide: ROLE_REPOSITORY,
          useValue: roleRepository,
        },
      ],
    }).compile();

    useCase = module.get(CreateUserUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el rol no existe', async () => {
      const dto: CreateUserDto = {
        accountId: 'account-1',
        roleId: 'role-1',
        fullname: 'Juan Pérez',
        phone: '3001234567',
      };

      roleRepository.findById.mockResolvedValue(null);

      await expect(useCase.run(dto)).rejects.toBeInstanceOf(AppError);

      expect(roleRepository.findById).toHaveBeenCalledWith(dto.roleId);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it('debe crear un usuario cuando el rol existe', async () => {
      const dto: CreateUserDto = {
        accountId: 'account-1',
        roleId: 'role-1',
        fullname: 'Juan Pérez',
        phone: '3001234567',
      };

      roleRepository.findById.mockResolvedValue({
        roleId: 'role-1',
        name: 'Administrador',
      });

      userRepository.create.mockResolvedValue(undefined);

      await expect(useCase.run(dto)).resolves.toBeUndefined();

      expect(roleRepository.findById).toHaveBeenCalledWith(dto.roleId);

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
