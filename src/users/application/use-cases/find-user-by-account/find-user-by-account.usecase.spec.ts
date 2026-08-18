import { Test, TestingModule } from '@nestjs/testing';

/** Excepciones de dominio */
import { USER_ERROR_CODES } from '../../../domain/exceptions/user-error-codes';
/** Entidad de dominio */
import { User } from '../../../domain/entities';
/** Puertos */
import { USER_REPOSITORY, UserRepositoryPort } from '../../../domain/ports';

/** Casos de uso */
import { FindUserByAccountUseCase } from './find-user-by-account.usecase';

describe('FindUserByAccountUseCase', () => {
  let useCase: FindUserByAccountUseCase;

  const mockUserRepository = {
    findByAccountId: jest.fn(),
  } satisfies Pick<UserRepositoryPort, 'findByAccountId'>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindUserByAccountUseCase,
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    useCase = module.get(FindUserByAccountUseCase);

    jest.clearAllMocks();
  });

  describe('run()', () => {
    it('debe lanzar AppError cuando el perfil de usuario no existe', async () => {
      //Arrange
      const accountId: string = 'test-account-id';

      mockUserRepository.findByAccountId.mockResolvedValue(null);

      //Act
      const profile = useCase.run(accountId);

      //Assert
      await expect(profile).rejects.toMatchObject({
        name: USER_ERROR_CODES.userNotFound,
        httpCode: 404,
      });

      expect(mockUserRepository.findByAccountId).toHaveBeenCalledWith(
        accountId,
      );
    });

    it('debe traer un usuario cuando el accountId corresponde a un usuario registrado', async () => {
      //Arrange
      const accountId: string = 'test-account-id';

      const expectedProfile = new User(
        'user-1',
        'Juan Perez',
        'test-account-id',
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
      );

      mockUserRepository.findByAccountId.mockResolvedValue(expectedProfile);

      //Act
      const profile = await useCase.run(accountId);

      //Assert
      expect(profile).toBe(expectedProfile);

      expect(mockUserRepository.findByAccountId).toHaveBeenCalledWith(
        accountId,
      );
    });
  });
});
