import { InvalidRefreshTokenException } from '../exceptions';

export class RefreshToken {
  private constructor(private readonly value: string) {}

  static create(value: string): RefreshToken {
    const normalized = value.trim();

    if (!normalized)
      throw new InvalidRefreshTokenException(
        'Refresh token no puede ser vacio',
      );

    if (!RefreshToken.isValid(normalized))
      throw new InvalidRefreshTokenException(
        'El refresh token tiene un formato invalido',
      );

    return new RefreshToken(normalized);
  }

  equals(other: RefreshToken): boolean {
    return this.value === other.value;
  }

  private static isValid(value: string): boolean {
    return /^[a-f0-9]{128}$/i.test(value);
  }

  toString(): string {
    return this.value;
  }
}
