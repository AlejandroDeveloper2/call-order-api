import { createHash, timingSafeEqual } from 'node:crypto';

import { TokenHasherPort } from '../../domain/ports';

export class NodeTokenHasherAdapter implements TokenHasherPort {
  hash(token: string): string {
    return createHash('sha256').update(token, 'utf8').digest('hex');
  }

  compare(token: string, hashedToken: string): boolean {
    const tokenHash = this.hash(token);

    const tokenBuffer = Buffer.from(tokenHash, 'hex');
    const storedHashBuffer = Buffer.from(hashedToken, 'hex');

    if (tokenBuffer.length !== storedHashBuffer.length) {
      return false;
    }

    return timingSafeEqual(tokenBuffer, storedHashBuffer);
  }
}
