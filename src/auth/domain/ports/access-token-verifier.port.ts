import { AccessTokenPayload } from '../types';

export abstract class AccessTokenVerifierPort {
  abstract verify(token: string): Promise<AccessTokenPayload>;
}
