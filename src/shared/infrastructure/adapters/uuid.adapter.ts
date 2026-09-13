import { Injectable } from '@nestjs/common';
import { v7 as uuidv7 } from 'uuid';

import { IdGeneratorPort } from '../../domain/ports';

@Injectable()
export class UUIDAdapter implements IdGeneratorPort {
  generate(): string {
    return uuidv7();
  }
}
