import { Test, TestingModule } from '@nestjs/testing';

/** Entidad de dominio */
import { User, UserSearchQuery } from '../../../domain/entities';
/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindUsersUseCase } from './find-users.usecase';
import { PaginatedResponse } from '../../../../shared/domain/types';

describe('FindUsersUseCase', () => {
  let useCase: FindUsersUseCase;

  const userRepository = {
    find: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'find'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUsersUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: userRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindUsersUseCase);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe traer una lista paginada de usuarios', async () => {
      const query = new UserSearchQuery();

      const user1 = new User(
        'user-1',
        'Juan Perez',
        'test-account-id-1',
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
      const user2 = new User(
        'user-2',
        'Alejandro Bonilla',
        'test-account-id-2',
        'role-1',
        undefined,
        '3105117894',
        true,
        {
          accountId: 'test-account-id-2',
          email: 'alejo@gmail.com',
        },
        { roleId: 'role-1', name: 'Administrador' },
      );

      const expectedPaginatedList: PaginatedResponse<User> = {
        records: [user1, user2],
        page: 1,
        totalPages: 1,
        totalRecords: 2,
      };

      userRepository.find.mockResolvedValue(expectedPaginatedList);

      await expect(useCase.run(query)).resolves.toBe(expectedPaginatedList);

      expect(userRepository.find).toHaveBeenCalledWith(query);
    });
  });
});
