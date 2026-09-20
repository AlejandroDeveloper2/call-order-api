import * as bcrypt from 'bcrypt';

import { BcryptAdapter } from './bcrypt.adapter';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

type BcryptMock = {
  compare: jest.Mock<Promise<boolean>, [string | Buffer, string]>;
  hash: jest.Mock<Promise<string>, [string | Buffer, string | number]>;
};

describe('BcryptAdapter', () => {
  let bcryptMock: jest.Mocked<BcryptMock>;

  beforeEach(() => {
    bcryptMock = bcrypt as unknown as jest.Mocked<BcryptMock>;
    jest.clearAllMocks();
  });

  it('deberia delegar la comparacion a bcrypt', async () => {
    // Arrange
    bcryptMock.compare.mockResolvedValue(true);
    const adapter = new BcryptAdapter();

    // Act
    const result = await adapter.compare('plain-password', 'password-hash');

    // Assert
    expect(result).toBe(true);
    expect(bcryptMock.compare.mock.calls).toContainEqual([
      'plain-password',
      'password-hash',
    ]);
  });

  it('deberia devolver false cuando bcrypt rechaza la contrasena', async () => {
    // Arrange
    bcryptMock.compare.mockResolvedValue(false);
    const adapter = new BcryptAdapter();

    // Act
    const result = await adapter.compare('wrong-password', 'password-hash');

    // Assert
    expect(result).toBe(false);
  });

  it('deberia delegar el hash con el numero de rondas recibido', async () => {
    // Arrange
    bcryptMock.hash.mockResolvedValue('password-hash');
    const adapter = new BcryptAdapter();

    // Act
    const result = await adapter.hash('plain-password', 14);

    // Assert
    expect(result).toBe('password-hash');
    expect(bcryptMock.hash.mock.calls).toContainEqual(['plain-password', 14]);
  });

  it('deberia propagar errores de bcrypt al generar el hash', async () => {
    // Arrange
    const error = new Error('Bcrypt unavailable');
    bcryptMock.hash.mockRejectedValue(error);
    const adapter = new BcryptAdapter();

    // Act
    const result = adapter.hash('plain-password', 14);

    // Assert
    await expect(result).rejects.toBe(error);
  });
});
