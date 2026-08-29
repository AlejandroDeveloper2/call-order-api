/** Puertos */
import { AccountRepositoryPort, EncryptorPort } from '../../../domain/ports';

/** Caso de uso */
import { UpdatePasswordUseCase } from './update-password.usecase';

/** Commands */
import { UpdatePasswordCommand } from '../../commands';

/** Excepciones de aplicación */
import { AccountNotFoundException } from '../../exceptions';
import { InvalidPasswordException } from '../../../domain/exceptions';

type AccountRepositoryMock = Pick<AccountRepositoryPort, 'updatePassword'>;
type EncryptorMock = Pick<EncryptorPort, 'hash'>;

describe('UpdatePasswordUseCase', () => {
  let useCase: UpdatePasswordUseCase;
  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;
  let encryptorMock: jest.Mocked<EncryptorMock>;

  const updatePasswordCommand: UpdatePasswordCommand = {
    newPassword: 'PasswordSecure@12',
  };

  beforeEach(() => {
    accountRepositoryMock = {
      updatePassword: jest.fn(),
    };

    encryptorMock = {
      hash: jest.fn(),
    };

    useCase = new UpdatePasswordUseCase(
      accountRepositoryMock as unknown as AccountRepositoryPort,
      encryptorMock as unknown as EncryptorPort,
    );

    jest.clearAllMocks();
  });

  describe('(run)', () => {
    it('deberia lanzar InvalidPasswordException si la contraseña no es valida', async () => {
      //Arrange
      const accountId = 'test-account-id';

      // Act
      const result = useCase.run(accountId, { newPassword: 'pass12' });

      // Assert
      await expect(result).rejects.toThrow(InvalidPasswordException);

      expect(encryptorMock.hash).not.toHaveBeenCalled();
      expect(accountRepositoryMock.updatePassword).not.toHaveBeenCalled();
    });

    it('deberia lanzar un AccountNotFoundException si la cuenta no existe', async () => {
      //Arrange
      const accountId = 'wrong-account-id';

      accountRepositoryMock.updatePassword.mockResolvedValue(0);

      encryptorMock.hash.mockResolvedValue('new-password-hash');

      //Act
      const result = useCase.run(accountId, updatePasswordCommand);

      //Assert
      await expect(result).rejects.toThrow(AccountNotFoundException);

      expect(accountRepositoryMock.updatePassword).toHaveBeenCalledWith(
        accountId,
        'new-password-hash',
      );
      expect(accountRepositoryMock.updatePassword).toHaveBeenCalledTimes(1);

      expect(encryptorMock.hash).toHaveBeenCalledWith(
        updatePasswordCommand.newPassword,
        14,
      );
      expect(encryptorMock.hash).toHaveBeenCalledTimes(1);
    });

    it('deberia actualizar la contraseña cuando la cuenta existe', async () => {
      //Arrange
      const accountId = 'test-account-id';

      accountRepositoryMock.updatePassword.mockResolvedValue(1);

      encryptorMock.hash.mockResolvedValue('new-password-hash');

      //Act
      const result = await useCase.run(accountId, updatePasswordCommand);

      //Assert
      expect(result).toBeUndefined();

      expect(accountRepositoryMock.updatePassword).toHaveBeenCalledWith(
        accountId,
        'new-password-hash',
      );
      expect(accountRepositoryMock.updatePassword).toHaveBeenCalledTimes(1);

      expect(encryptorMock.hash).toHaveBeenCalledWith(
        updatePasswordCommand.newPassword,
        14,
      );
      expect(encryptorMock.hash).toHaveBeenCalledTimes(1);
    });
  });
});
