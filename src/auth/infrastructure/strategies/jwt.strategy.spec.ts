import { ConfigService } from '@nestjs/config';

/** Casos de uso */
import { ValidateAccessTokenUseCase } from '../../application/use-cases';

/** Estrategias */
import { JwtStrategy } from './jwt.strategy';

type ConfigServiceMock = Pick<ConfigService, 'get'>;
type ValidateAccessTokenUseCaseMock = Pick<ValidateAccessTokenUseCase, 'run'>;

describe('JwtStrategy', () => {
  let configServiceMock: jest.Mocked<ConfigServiceMock>;
  let validateAccessTokenUseCaseMock: jest.Mocked<ValidateAccessTokenUseCaseMock>;
  let strategy: JwtStrategy;

  beforeEach(() => {
    configServiceMock = {
      get: jest.fn().mockReturnValue('test-secret'),
    };
    validateAccessTokenUseCaseMock = {
      run: jest.fn(),
    };

    strategy = new JwtStrategy(
      configServiceMock as unknown as ConfigService,
      validateAccessTokenUseCaseMock as unknown as ValidateAccessTokenUseCase,
    );
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('deberia delegar la validacion del payload al caso de uso', async () => {
    // Arrange
    const payload = {
      accountId: 'account-id',
      roleId: 'role-id',
      profileId: 'profile-id',
      permissions: [],
    };
    const runMock = jest.spyOn(validateAccessTokenUseCaseMock, 'run');
    runMock.mockResolvedValue(payload);

    // Act
    const result = await strategy.validate(payload);

    // Assert
    expect(result).toBe(payload);
    expect(runMock.mock.calls).toContainEqual([payload]);
  });
});
