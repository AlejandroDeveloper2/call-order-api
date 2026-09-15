import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { addDays } from 'date-fns';

import {
  PostgresAccountSchema,
  PostgresSessionSchema,
  PostgresVerificationCodeSchema,
} from '../../../auth/infrastructure/persistence/postgres/schemas';

@Injectable()
export class SessionsSeeder {
  constructor(
    @InjectRepository(PostgresAccountSchema)
    private readonly accountRepository: Repository<PostgresAccountSchema>,
    @InjectRepository(PostgresVerificationCodeSchema)
    private readonly sessionRepository: Repository<PostgresSessionSchema>,
  ) {}

  async updateToExpiredSession(email: string): Promise<void> {
    const account = await this.accountRepository.findOneBy({ email });

    if (!account) return;

    await this.sessionRepository.update(
      { accountId: account.id, expiresAt: IsNull() },
      {
        expiresAt: addDays(new Date(), -2),
      },
    );
  }
}
