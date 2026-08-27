import { createHmac } from 'node:crypto';

import { VerificationCodeLookupPort } from '../../domain/ports';

export class HmacVerificationCodeLookupAdapter implements VerificationCodeLookupPort {
  constructor(private readonly secret: string) {}

  generateLookup(code: string): string {
    return createHmac('sha256', this.secret).update(code).digest('hex');
  }
}
