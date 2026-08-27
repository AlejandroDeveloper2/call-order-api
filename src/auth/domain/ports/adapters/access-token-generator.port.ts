import { AccessTokenPayload } from '../../types';

export abstract class AccessTokenGeneratorPort {
  abstract generate(payload: AccessTokenPayload): Promise<string>;
}

export const ACCESS_TOKEN_GENERATOR = Symbol('ACCESS_TOKEN_GENERATOR');
