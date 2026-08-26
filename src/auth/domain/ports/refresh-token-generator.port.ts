export abstract class RefreshTokenGeneratorPort {
  abstract generate(): string;
}

export const REFRESH_TOKEN_GENERATOR = Symbol('REFRESH_TOKEN_GENERATOR');
