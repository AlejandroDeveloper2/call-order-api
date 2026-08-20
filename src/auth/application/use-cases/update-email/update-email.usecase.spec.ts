import { Test, TestingModule } from '@nestjs/testing';

/** Puertos */
import {
  ACCOUNT_REPOSITORY,
  AccountRepositoryPort,
} from '../../../domain/ports';

/** Excepciones */
import { AUTH_ERROR_CODES } from '../../../domain/exceptions/auth-error-codes';

/** Dtos */
import { UpdateEmailDto } from '../../dto';

/** Casos de uso */
import { UpdateEmailUseCase } from './update-email.usecase';

describe('UpdateEmailUseCase', () => {
  let useCase: UpdateEmailUseCase;

  const accountRepository = {
    update: jest.fn(),
  } satisfies Pick<AccountRepositoryPort, 'update'>;

  const updateEmailDto: UpdateEmailDto = {
    updatedEmail: 'nuevo_correo@gmail.com',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateEmailUseCase,
        {
          provide: ACCOUNT_REPOSITORY,
          useValue: accountRepository,
        },
      ],
    }).compile();

    useCase = module.get<UpdateEmailUseCase>(UpdateEmailUseCase);
    jest.clearAllMocks();
  });

  describe('(run)', () => {
    it('deberia lanzar un AppError cuando el accountId no corresponda a ninguna cuenta registrada', async () => {
      // Arrange
      const accountId = 'wrong-account-id';

      accountRepository.update.mockResolvedValue(0);

      // Act
      const result = useCase.run(accountId, updateEmailDto);

      //Assert
      await expect(result).rejects.toMatchObject({
        name: AUTH_ERROR_CODES.accountNotFound,
        httpCode: 404,
      });

      expect(accountRepository.update).toHaveBeenCalledWith(
        accountId,
        expect.objectContaining({
          email: updateEmailDto.updatedEmail,
        }),
      );
    });

    it('deberia actualizar el correo electrónico asociado a la cuenta si la cuenta existe', async () => {
      // Arrange
      const accountId = 'test-account-id';

      accountRepository.update.mockResolvedValue(1);

      //Act
      const result = await useCase.run(accountId, updateEmailDto);

      //Assert
      expect(result).toBeUndefined();
      expect(accountRepository.update).toHaveBeenCalledWith(
        accountId,
        expect.objectContaining({
          email: updateEmailDto.updatedEmail,
        }),
      );
    });
  });
});
