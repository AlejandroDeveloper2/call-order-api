import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';

/** Códigos de error */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Caso de uso */
import { ChangePasswordUseCase } from './change-password.usecase';

/** Dtos */
import { ChangePasswordDto } from '../../../infrastructure/dto';

/** Utilidades */
import { buildAccount } from '../../../../shared/application/utils/domain-class-contructor';

jest.mock('bcrypt');

describe('ChangePasswordUseCase', () => {
  let useCase: ChangePasswordUseCase;

  const accountRepository = {
    update: jest.fn(),
    findById: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'update' | 'findById'>;

  const bcryptCompareMock = jest.mocked<
    (data: string | Buffer, encrypted: string) => Promise<boolean>
  >(bcrypt.compare);

  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  const changePasswordDto: ChangePasswordDto = {
    currentPassword: 'current-password',
    newPassword: 'new-password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChangePasswordUseCase,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
      ],
    }).compile();

    useCase = module.get<ChangePasswordUseCase>(ChangePasswordUseCase);
    jest.clearAllMocks();
  });

  describe('(run)', () => {
    it('deberia lanzar un AppError si la cuenta no existe', async () => {
      //Arrange
      const accountId = 'wrong-account-id';

      accountRepository.findById.mockResolvedValue(null);

      //Act
      const result = useCase.run(accountId, changePasswordDto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountNotFound,
        httpCode: 404,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);
      expect(bcryptCompareMock).not.toHaveBeenCalled();
      expect(bcryptHashMock).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
    });

    it('deberia lanzar un AppError si la contraseña actual no es correcta', async () => {
      //Arrange
      const accountId = 'test-account-id';

      const account = buildAccount();

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockResolvedValueOnce(false);

      // Act
      const result = useCase.run(accountId, changePasswordDto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.incorrectPassword,
        httpCode: 400,
      });

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);

      expect(bcryptCompareMock).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        account.passwordHash,
      );
      expect(bcryptCompareMock).toHaveBeenCalledTimes(1);

      expect(bcryptHashMock).not.toHaveBeenCalled();
      expect(accountRepository.update).not.toHaveBeenCalled();
    });

    it('deberia cambiar la contraseña de la cuenta por la nueva, cuando la cuenta existe y la contraseña previa coincide', async () => {
      //Arrange
      const accountId = 'test-account-id';

      const account = buildAccount();

      accountRepository.findById.mockResolvedValue(account);

      bcryptCompareMock.mockResolvedValueOnce(true);

      bcryptHashMock.mockResolvedValueOnce('new-password-hash');

      accountRepository.update.mockResolvedValue(undefined);

      //Act
      const result = await useCase.run(accountId, changePasswordDto);

      //Assert
      expect(result).toBeUndefined();

      expect(accountRepository.findById).toHaveBeenCalledWith(accountId);

      expect(bcryptCompareMock).toHaveBeenCalledWith(
        changePasswordDto.currentPassword,
        account.passwordHash,
      );
      expect(bcryptCompareMock).toHaveBeenCalledTimes(1);

      expect(bcryptHashMock).toHaveBeenCalledWith(
        changePasswordDto.newPassword,
        10,
      );
      expect(bcryptHashMock).toHaveBeenCalledTimes(1);

      expect(accountRepository.update).toHaveBeenCalledWith(accountId, {
        passwordHash: 'new-password-hash',
      });
    });
  });
});
