import { Test, TestingModule } from '@nestjs/testing';

/** Entidad de dominio */
import { User, UserSearchQuery } from '../../../domain/entities';
/** Tipos */
import { PaginatedResponse } from '../../../../shared/domain/types';
/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindUsersUseCase } from './find-users.usecase';

describe('FindUsersUseCase', () => {
  let useCase: FindUsersUseCase;

  const mockUserRepository = {
    find: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'find'>;

  const users: User[] = [
    new User(
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
        passwordHash: 'hash',
        mustChangePassword: false,
        lastLoginAt: new Date(),
        failedAttempts: 0,
      },
      { roleId: 'role-1', name: 'Administrador' },
    ),
    new User(
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
        passwordHash: 'hash',
        mustChangePassword: false,
        lastLoginAt: new Date(),
        failedAttempts: 0,
      },
      { roleId: 'role-1', name: 'Administrador' },
    ),
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUsersUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindUsersUseCase);

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe traer una lista paginada de perfiles de usuario', async () => {
      //Arrange
      const query = new UserSearchQuery();

      const expectedPaginatedList: PaginatedResponse<User> = {
        records: users,
        page: 1,
        totalPages: 1,
        totalRecords: 2,
      };

      mockUserRepository.find.mockResolvedValue(expectedPaginatedList);

      //Act
      const paginatedUsers = await useCase.run(query);

      //Assert
      expect(paginatedUsers).toBe(expectedPaginatedList);

      expect(mockUserRepository.find).toHaveBeenCalledWith(query);
    });
  });
});
