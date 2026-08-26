export abstract class TokenHasherPort {
  abstract hash(token: string): string;
  abstract compare(token: string, hashedToken: string): boolean;
}

export const TOKEN_HASHER = Symbol('TOKEN_HASHER');
