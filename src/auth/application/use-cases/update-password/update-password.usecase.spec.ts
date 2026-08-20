import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';

import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';

import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

import { UpdatePasswordUseCase } from './update-password.usecase';

import { UpdatePasswordDto } from '../../dto';

jest.mock('bcrypt');

describe('UpdatePasswordUseCase', () => {
  let useCase: UpdatePasswordUseCase;

  const accountRepository = {
    update: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'update'>;

  const bcryptHashMock = jest.mocked<
    (data: string | Buffer, saltOrRounds: string | number) => Promise<string>
  >(bcrypt.hash);

  const updatePasswordDto: UpdatePasswordDto = {
    newPassword: 'new-password',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePasswordUseCase,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdatePasswordUseCase>(UpdatePasswordUseCase);
    jest.clearAllMocks();
  });

  describe('(run)', () => {
    it('deberia lanzar un AppError si la cuenta no existe', async () => {
      //Arrange
      const accountId = 'wrong-account-id';

      accountRepository.update.mockResolvedValue(0);

      bcryptHashMock.mockResolvedValueOnce('new-password-hash');

      //Act
      const result = useCase.run(accountId, updatePasswordDto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountNotFound,
        httpCode: 404,
      });

      expect(accountRepository.update).toHaveBeenCalledWith(accountId, {
        passwordHash: 'new-password-hash',
      });
      expect(accountRepository.update).toHaveBeenCalledTimes(1);

      expect(bcryptHashMock).toHaveBeenCalledWith(
        updatePasswordDto.newPassword,
        10,
      );
      expect(bcryptHashMock).toHaveBeenCalledTimes(1);
    });

    it('deberia actualizar la contraseña cuando la cuenta existe', async () => {
      //Arrange
      const accountId = 'test-account-id';

      accountRepository.update.mockResolvedValue(1);

      bcryptHashMock.mockResolvedValueOnce('new-password-hash');

      //Act
      const result = await useCase.run(accountId, updatePasswordDto);

      //Assert
      expect(result).toBeUndefined();

      expect(accountRepository.update).toHaveBeenCalledWith(accountId, {
        passwordHash: 'new-password-hash',
      });
      expect(accountRepository.update).toHaveBeenCalledTimes(1);

      expect(bcryptHashMock).toHaveBeenCalledWith(
        updatePasswordDto.newPassword,
        10,
      );
      expect(bcryptHashMock).toHaveBeenCalledTimes(1);
    });
  });
});
