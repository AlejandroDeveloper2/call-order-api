import { HmacVerificationCodeLookupAdapter } from './hmac-verification-code-lookup.adapter';

describe('HmacVerificationCodeLookupAdapter', () => {
  it('deberia generar siempre el mismo lookup para el mismo codigo y secreto', () => {
    // Arrange
    const adapter = new HmacVerificationCodeLookupAdapter('test-secret');

    // Act
    const firstLookup = adapter.generateLookup('123456');
    const secondLookup = adapter.generateLookup('123456');

    // Assert
    expect(firstLookup).toBe(secondLookup);
    expect(firstLookup).toHaveLength(64);
  });

  it('deberia producir valores diferentes para codigos distintos', () => {
    // Arrange
    const adapter = new HmacVerificationCodeLookupAdapter('test-secret');

    // Act
    const firstLookup = adapter.generateLookup('123456');
    const secondLookup = adapter.generateLookup('654321');

    // Assert
    expect(firstLookup).not.toBe(secondLookup);
  });
});
