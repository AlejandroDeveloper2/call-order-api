import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { EncryptorPort } from '../../domain/ports';

@Injectable()
export class BcryptAdapter implements EncryptorPort {
  async compare(data: string | Buffer, encrypted: string): Promise<boolean> {
    return await bcrypt.compare(data, encrypted);
  }
  async hash(
    data: string | Buffer,
    saltOrRounds: string | number,
  ): Promise<string> {
    return await bcrypt.hash(data, saltOrRounds);
  }
}
