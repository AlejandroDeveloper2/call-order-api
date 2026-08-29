/** Puertos */
import { AccountRepositoryPort } from '../../../domain/ports';

/** Excepción de dominio */
import { InvalidEmailException } from '../../../domain/exceptions';

/** Casos de uso */
import { UpdateEmailUseCase } from './update-email.usecase';

/** Commands */
import { UpdateEmailCommand } from '../../commands';

/** Excepción de aplicación */
import { AccountNotFoundException } from '../../exceptions';

type AccountRepositoryMock = Pick<AccountRepositoryPort, 'updateEmail'>;

describe('UpdateEmailUseCase', () => {
  let useCase: UpdateEmailUseCase;
  let accountRepositoryMock: jest.Mocked<AccountRepositoryMock>;

  const updateEmailCommand: UpdateEmailCommand = {
    updatedEmail: 'tom.doe@gmail.com',
  };

  beforeEach(() => {
    accountRepositoryMock = {
      updateEmail: jest.fn(),
    };

    useCase = new UpdateEmailUseCase(
      accountRepositoryMock as unknown as AccountRepositoryPort,
    );

    jest.clearAllMocks();
  });

  describe('(run)', () => {
    it('deberia lanzar InvalidEmailException si el correo no es valido', async () => {
      // Arrange
      const accountId = 'test-account-id';

      // Act
      const result = useCase.run(accountId, { updatedEmail: 'tom.doe' });

      // Assert
      await expect(result).rejects.toThrow(InvalidEmailException);

      expect(accountRepositoryMock.updateEmail).not.toHaveBeenCalled();
    });

    it('deberia lanzar un AccountNotFoundException cuando el accountId no corresponda a ninguna cuenta registrada', async () => {
      // Arrange
      const accountId = 'wrong-account-id';

      accountRepositoryMock.updateEmail.mockResolvedValue(0);

      // Act
      const result = useCase.run(accountId, updateEmailCommand);

      //Assert
      await expect(result).rejects.toThrow(AccountNotFoundException);

      expect(accountRepositoryMock.updateEmail).toHaveBeenCalledWith(
        accountId,
        updateEmailCommand.updatedEmail,
      );
    });

    it('deberia actualizar el correo electrónico asociado a la cuenta si la cuenta existe', async () => {
      // Arrange
      const accountId = 'test-account-id';

      accountRepositoryMock.updateEmail.mockResolvedValue(1);

      //Act
      const result = await useCase.run(accountId, updateEmailCommand);

      //Assert
      expect(result).toBeUndefined();
      expect(accountRepositoryMock.updateEmail).toHaveBeenCalledWith(
        accountId,
        updateEmailCommand.updatedEmail,
      );
    });
  });
});
