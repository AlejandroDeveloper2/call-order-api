import { InvalidTokenException } from '../exceptions';

export class JwtAccessToken {
  private constructor(private readonly value: string) {}

  static create(value: string): JwtAccessToken {
    const normalized = value.trim();

    if (!normalized)
      throw new InvalidTokenException('JWT tokenno puede ser vacio');

    if (!JwtAccessToken.isJwtStructure(normalized))
      throw new InvalidTokenException('Formato invalido del JWT token');

    return new JwtAccessToken(normalized);
  }

  equals(other: JwtAccessToken): boolean {
    return this.value === other.value;
  }

  private static isJwtStructure(value: string): boolean {
    const parts = value.split('.');

    if (parts.length !== 3) {
      return false;
    }

    return parts.every((part) => part.length > 0);
  }

  toString(): string {
    return this.value;
  }
}
