import { NodeTokenHasherAdapter } from './node-token-hasher.adapter';

describe('NodeTokenHasherAdapter', () => {
  it('deberia generar un hash SHA-256 hexadecimal', () => {
    // Arrange
    const adapter = new NodeTokenHasherAdapter();

    // Act
    const result = adapter.hash('refresh-token');

    // Assert
    expect(result).toHaveLength(64);
    expect(result).toMatch(/^[a-f0-9]+$/);
  });

  it('deberia comparar correctamente un token con su hash', () => {
    // Arrange
    const adapter = new NodeTokenHasherAdapter();
    const hash = adapter.hash('refresh-token');

    // Act
    const result = adapter.compare('refresh-token', hash);

    // Assert
    expect(result).toBe(true);
  });

  it('deberia rechazar un token diferente', () => {
    // Arrange
    const adapter = new NodeTokenHasherAdapter();
    const hash = adapter.hash('refresh-token');

    // Act
    const result = adapter.compare('other-token', hash);

    // Assert
    expect(result).toBe(false);
  });

  it('deberia rechazar un hash almacenado con longitud diferente', () => {
    // Arrange
    const adapter = new NodeTokenHasherAdapter();

    // Act
    const result = adapter.compare('refresh-token', 'invalid-hash');

    // Assert
    expect(result).toBe(false);
  });
});
