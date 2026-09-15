import { CryptoRefreshTokenGeneratorAdapter } from './crypto-refresh-token-generator.adapter';

describe('CryptoRefreshTokenGeneratorAdapter', () => {
  it('deberia generar un refresh token hexadecimal seguro de 128 caracteres', () => {
    // Arrange
    const adapter = new CryptoRefreshTokenGeneratorAdapter();

    // Act
    const result = adapter.generate();

    // Assert
    expect(result).toHaveLength(128);
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it('deberia generar tokens diferentes en llamadas sucesivas', () => {
    // Arrange
    const adapter = new CryptoRefreshTokenGeneratorAdapter();

    // Act
    const firstToken = adapter.generate();
    const secondToken = adapter.generate();

    // Assert
    expect(firstToken).not.toBe(secondToken);
  });
});
