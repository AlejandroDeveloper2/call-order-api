import { AccessTokenPayload } from '../types';

export abstract class AccessTokenGeneratorPort {
  abstract generate(payload: AccessTokenPayload): Promise<string>;
}
