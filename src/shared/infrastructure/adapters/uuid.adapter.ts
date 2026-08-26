import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';

import { IdGeneratorPort } from '../../domain/ports';

@Injectable()
export class UUIDAdapter implements IdGeneratorPort {
  generate(): string {
    return uuidv4();
  }
}
