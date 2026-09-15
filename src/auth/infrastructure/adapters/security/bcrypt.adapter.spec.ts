jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

import * as bcrypt from 'bcrypt';

import { BcryptAdapter } from './bcrypt.adapter';

describe('BcryptAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deberia delegar la comparacion a bcrypt', async () => {
    // Arrange
    const compare = bcrypt.compare as jest.Mock;
    compare.mockResolvedValue(true);
    const adapter = new BcryptAdapter();

    // Act
    const result = await adapter.compare('plain-password', 'password-hash');

    // Assert
    expect(result).toBe(true);
    expect(compare.mock.calls).toContainEqual([
      'plain-password',
      'password-hash',
    ]);
  });

  it('deberia devolver false cuando bcrypt rechaza la contrasena', async () => {
    // Arrange
    const compare = bcrypt.compare as jest.Mock;
    compare.mockResolvedValue(false);
    const adapter = new BcryptAdapter();

    // Act
    const result = await adapter.compare('wrong-password', 'password-hash');

    // Assert
    expect(result).toBe(false);
  });

  it('deberia delegar el hash con el numero de rondas recibido', async () => {
    // Arrange
    const hash = bcrypt.hash as jest.Mock;
    hash.mockResolvedValue('password-hash');
    const adapter = new BcryptAdapter();

    // Act
    const result = await adapter.hash('plain-password', 14);

    // Assert
    expect(result).toBe('password-hash');
    expect(hash.mock.calls).toContainEqual(['plain-password', 14]);
  });

  it('deberia propagar errores de bcrypt al generar el hash', async () => {
    // Arrange
    const error = new Error('Bcrypt unavailable');
    const hash = bcrypt.hash as jest.Mock;
    hash.mockRejectedValue(error);
    const adapter = new BcryptAdapter();

    // Act
    const result = adapter.hash('plain-password', 14);

    // Assert
    await expect(result).rejects.toBe(error);
  });
});
