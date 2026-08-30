/** Entidades */
import { Permission } from '../../../../users/domain/entities';

/** Puertos */
import { PermissionRepositoryPort } from '../../../../users/domain/ports';
import { AccountRepositoryPort } from '../../../domain/ports';

/** Modelos de lectura */
import { AccountTokenValidationModel } from '../../../domain/models';

/** Tipos */
import { AccessTokenPayload } from '../../../domain/types';

/** Excepciones de aplicación */
import {
  AccountLockedException,
  AccountNotFoundException,
  InactiveAccountException,
} from '../../exceptions';

/** Caso de uso */
import { ValidateAccessTokenUseCase } from './validate-access-token.usecase';

type AccountRepositoryMock = Pick<
  AccountRepositoryPort,
  'findForTokenValidation'
>;
type PermissionRepositoryMock = Pick<
  PermissionRepositoryPort,
  'findPermissionsByRoleId'
>;

describe('ValidateAccessTokenUseCase', () => {
  let useCase: ValidateAccessTokenUseCase;
  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;
  let permissionRepositoryMock: jest.Mocked<PermissionRepositoryMock>;

  const payload: AccessTokenPayload = {
    accountId: 'test-account-id',
    roleId: 'test-role-id',
    profileId: 'test-profile-id',
  };

  const account: AccountTokenValidationModel = {
    accountId: 'test-account-id',
    profile: {
      profileId: 'test-profile-id',
      isActive: true,
      roleId: 'test-role-id',
    },
  };

  beforeEach(() => {
    accountRepositoryMock = {
      findForTokenValidation: jest.fn(),
    };

    permissionRepositoryMock = {
      findPermissionsByRoleId: jest.fn(),
    };

    useCase = new ValidateAccessTokenUseCase(
      accountRepositoryMock as unknown as AccountRepositoryPort,
      permissionRepositoryMock,
    );

    jest.clearAllMocks();
  });

  describe('(run)', () => {
    it('deberia lanzar AccountNotFoundException si no existe la cuenta', async () => {
      // Arrange
      const wrongAccountId = 'wrong-test-account-id';

      accountRepositoryMock.findForTokenValidation.mockResolvedValue(null);

      // Act
      const result = useCase.run({ ...payload, accountId: wrongAccountId });

      //Assert
      await expect(result).rejects.toThrow(AccountNotFoundException);

      expect(accountRepositoryMock.findForTokenValidation).toHaveBeenCalledWith(
        wrongAccountId,
      );

      expect(
        permissionRepositoryMock.findPermissionsByRoleId,
      ).not.toHaveBeenCalled();
    });

    it('deberia lanzar AccountLockedException si la cuenta esta bloqueada', async () => {
      // Arrange
      accountRepositoryMock.findForTokenValidation.mockResolvedValue({
        ...account,
        lockedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
      });

      // Act
      const result = useCase.run(payload);

      // Assert
      await expect(result).rejects.toThrow(AccountLockedException);

      expect(accountRepositoryMock.findForTokenValidation).toHaveBeenCalledWith(
        account.accountId,
      );

      expect(
        permissionRepositoryMock.findPermissionsByRoleId,
      ).not.toHaveBeenCalled();
    });

    it('deberia lanzar InactiveAccountException si la cuenta esta inactiva', async () => {
      // Arrange
      accountRepositoryMock.findForTokenValidation.mockResolvedValue({
        ...account,
        profile: {
          ...account.profile,
          isActive: false,
        },
      });

      // Act
      const result = useCase.run(payload);

      //Assert
      await expect(result).rejects.toThrow(InactiveAccountException);

      expect(accountRepositoryMock.findForTokenValidation).toHaveBeenCalledWith(
        account.accountId,
      );

      expect(
        permissionRepositoryMock.findPermissionsByRoleId,
      ).not.toHaveBeenCalled();
    });

    it('deberia devolver el payload con los permisos del usuario inyectados si el payload del token proporcionado es valido', async () => {
      // Arrange
      const permissions: Permission[] = [
        {
          permissionId: 'test-permission-id',
          code: 'auth:read:all',
          description: 'Permiso para listar todos los usuarios',
        },
      ];
      accountRepositoryMock.findForTokenValidation.mockResolvedValue(account);
      permissionRepositoryMock.findPermissionsByRoleId.mockResolvedValue(
        permissions,
      );

      // Act
      const result = await useCase.run(payload);

      // Assert
      expect(result).toEqual({
        accountId: account.accountId,
        profileId: account.profile.profileId,
        roleId: account.profile.roleId,
        permissions: permissions.map((p) => p.code),
      });

      expect(accountRepositoryMock.findForTokenValidation).toHaveBeenCalledWith(
        account.accountId,
      );

      expect(
        permissionRepositoryMock.findPermissionsByRoleId,
      ).toHaveBeenCalledWith(account.profile.roleId);

      expect(
        permissionRepositoryMock.findPermissionsByRoleId,
      ).toHaveBeenCalledTimes(1);
    });
  });
});
