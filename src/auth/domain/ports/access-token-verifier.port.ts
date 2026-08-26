import { AccessTokenPayload } from '../types';

export abstract class AccessTokenVerifierPort {
  abstract verify(token: string): Promise<AccessTokenPayload>;
}
export const ACCESS_TOKEN_VERIFIER = Symbol('ACCESS_TOKEN_VERIFIER');
