import { Test, TestingModule } from '@nestjs/testing';

/** Entidad de dominio */
import { User, UserSearchQuery } from '../../../domain/entities';
/** Tipos */
import { PaginatedResponse } from '../../../../shared/domain/types';
/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindUsersUseCase } from './find-accounts.usecase';

/** Utilidades */
import { buildProfile } from '../../../../shared/application/utils/domain-class-contructor';

describe('FindUsersUseCase', () => {
  let useCase: FindUsersUseCase;

  const mockUserRepository = {
    find: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'find'>;

  const users: User[] = [buildProfile(), buildProfile()];

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
