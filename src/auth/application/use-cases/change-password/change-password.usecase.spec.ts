/** Puertos */
import { AccountRepositoryPort, EncryptorPort } from '../../../domain/ports';

/** Modelos de lectura */
import { AccountPasswordUpdatingModel } from '../../../domain/models';

/** Excepciones de dominio */
import { InvalidPasswordException } from '../../../domain/exceptions';

/** Caso de uso */
import { ChangePasswordUseCase } from './change-password.usecase';

/** Commands */
import { ChangePasswordCommand } from '../../commands';

/** Excepciones de aplicación */
import {
  AccountNotFoundException,
  IncorrectPasswordException,
} from '../../exceptions';

type AccountRepositoryMock = Pick<
  AccountRepositoryPort,
  'findForUpdatingPassword' | 'updatePassword'
>;
type EncryptorMock = Pick<EncryptorPort, 'compare' | 'hash'>;

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;
  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;
  let encryptorMock: jest.Mocked<EncryptorMock>;

  const changePasswordCommand: ChangePasswordCommand = {
    currentPassword: 'Passwor12345@',
    newPassword: 'NewPassword12@',
  };

  beforeEach(() => {
    accountRepositoryMock = {
      findForUpdatingPassword: jest.fn(),
      updatePassword: jest.fn(),
    };

    encryptorMock = {
      compare: jest.fn(),
      hash: jest.fn(),
    };

    useCase = new ChangePasswordUseCase(
      accountRepositoryMock as unknown as AccountRepositoryPort,
      encryptorMock,
    );

    jest.clearAllMocks();
  });

  describe('(run)', () => {
    it('debería lanzar InvalidPasswordException si el nuevo password es inválido', async () => {
      // Arrange
      const accountId = 'test-account-id';

      const command = {
        currentPassword: '123456',
        newPassword: '',
      };

      // Act
      const result = useCase.run(accountId, command);

      // Assert
      await expect(result).rejects.toThrow(InvalidPasswordException);

      expect(
        accountRepositoryMock.findForUpdatingPassword,
      ).not.toHaveBeenCalled();

      expect(encryptorMock.compare).not.toHaveBeenCalled();

      expect(encryptorMock.hash).not.toHaveBeenCalled();

      expect(accountRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it('deberia lanzar una AccountNotFoundException si la cuenta no existe', async () => {
      //Arrange
      const accountId = 'wrong-account-id';

      accountRepositoryMock.findForUpdatingPassword.mockResolvedValue(null);

      //Act
      const result = useCase.run(accountId, changePasswordCommand);

      //Assert
      await expect(result).rejects.toThrow(AccountNotFoundException);

      expect(
        accountRepositoryMock.findForUpdatingPassword,
      ).toHaveBeenCalledWith(accountId);

      expect(encryptorMock.compare).not.toHaveBeenCalled();
      expect(accountRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it('deberia lanzar un IncorrectPasswordException si la contraseña actual no es correcta', async () => {
      //Arrange
      const accountId = 'test-account-id';
      const account: AccountPasswordUpdatingModel = {
        accountId,
        passwordHash: 'stored-password-hash',
      };

      accountRepositoryMock.findForUpdatingPassword.mockResolvedValue(account);

      encryptorMock.compare.mockResolvedValue(false);

      // Act
      const result = useCase.run(accountId, changePasswordCommand);

      //Assert
      await expect(result).rejects.toThrow(IncorrectPasswordException);

      expect(
        accountRepositoryMock.findForUpdatingPassword,
      ).toHaveBeenCalledWith(accountId);

      expect(encryptorMock.compare).toHaveBeenCalledWith(
        changePasswordCommand.currentPassword,
        account.passwordHash,
      );

      expect(encryptorMock.compare).toHaveBeenCalledTimes(1);

      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(accountRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it('deberia cambiar la contraseña de la cuenta por la nueva, cuando la cuenta existe y la contraseña previa coincide', async () => {
      //Arrange
      const accountId = 'test-account-id';
      const account: AccountPasswordUpdatingModel = {
        accountId,
        passwordHash: 'stored-password-hash',
      };
      const newPasswordHash = 'new-password-hash';

      accountRepositoryMock.findForUpdatingPassword.mockResolvedValue(account);

      encryptorMock.compare.mockResolvedValue(true);

      encryptorMock.hash.mockResolvedValue(newPasswordHash);

      accountRepositoryMock.updatePassword.mockResolvedValue(1);

      //Act
      const result = await useCase.run(accountId, changePasswordCommand);

      //Assert
      expect(result).toBeUndefined();

      expect(
        accountRepositoryMock.findForUpdatingPassword,
      ).toHaveBeenCalledWith(accountId);

      expect(encryptorMock.compare).toHaveBeenCalledWith(
        changePasswordCommand.currentPassword,
        account.passwordHash,
      );
      expect(encryptorMock.compare).toHaveBeenCalledTimes(1);

      expect(encryptorMock.hash).toHaveBeenCalledWith(
        changePasswordCommand.newPassword,
        14,
      );
      expect(encryptorMock.hash).toHaveBeenCalledTimes(1);

      expect(accountRepositoryMock.updatePassword).toHaveBeenCalledWith(
        accountId,
        newPasswordHash,
      );
    });
  });
});
