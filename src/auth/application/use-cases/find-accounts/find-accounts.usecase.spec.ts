/** Modelos de lectura */
import { AccountWithoutSensitiveDataModel } from '../../../domain/models';

/** Tipos */
import { PaginatedResponse } from '../../../../shared/domain/types';

/** Puertos */
import { AccountRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindAccountsUseCase } from './find-accounts.usecase';

/** Commands */
import { FindAccountsQueryCommand } from '../../commands';

type AccountRepositoryMock = jest.Mocked<Pick<AccountRepositoryPort, 'find'>>;

describe('FindAccountsUseCase', () => {
  let useCase: FindAccountsUseCase;
  let accountReposiotryMock: AccountRepositoryMock;

  const accounts: AccountWithoutSensitiveDataModel[] = [
    {
      accountId: 'test-account-id-1',
      email: 'jhon.doe@example.com',
      fullname: 'Jhon Doe',
      roleId: 'test-role-id',
      roleName: 'Admin',
      isActive: true,
    },
    {
      accountId: 'test-account-id-2',
      email: 'peter.doe@example.com',
      fullname: 'Peter Doe',
      roleId: 'test-role-id',
      roleName: 'Admin',
      isActive: true,
    },
  ];

  beforeEach(() => {
    accountReposiotryMock = {
      find: jest.fn(),
    };

    useCase = new FindAccountsUseCase(
      accountReposiotryMock as unknown as AccountRepositoryPort,
    );

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe traer una lista paginada de cuentas de usuario', async () => {
      //Arrange
      const findAccountsQueryCommand: FindAccountsQueryCommand = { limit: 10 };

      const expectedPaginatedList: PaginatedResponse<AccountWithoutSensitiveDataModel> =
        {
          records: accounts,
          page: 1,
          totalPages: 1,
          totalRecords: 2,
        };

      accountReposiotryMock.find.mockResolvedValue(expectedPaginatedList);

      //Act
      const paginatedAccounts = await useCase.run(findAccountsQueryCommand);

      //Assert
      expect(paginatedAccounts).toBe(expectedPaginatedList);

      expect(accountReposiotryMock.find).toHaveBeenCalledWith(
        findAccountsQueryCommand,
      );
    });
  });
});
