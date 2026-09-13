import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import { addMinutes } from 'date-fns';

import {
  PostgresAccountSchema,
  PostgresVerificationCodeSchema,
} from '../../../auth/infrastructure/persistence/postgres/schemas';

@Injectable()
export class VerificationCodesSeeder {
  constructor(
    @InjectRepository(PostgresAccountSchema)
    private readonly accountRepository: Repository<PostgresAccountSchema>,
    @InjectRepository(PostgresVerificationCodeSchema)
    private readonly verificationCodeRepository: Repository<PostgresVerificationCodeSchema>,
  ) {}

  async updateToExpiredCode(email: string): Promise<void> {
    const account = await this.accountRepository.findOneBy({ email });

    if (!account) return;

    await this.verificationCodeRepository.update(
      { accountId: account.id, usedAt: Not(IsNull()) },
      {
        expiresAt: addMinutes(new Date(), -11),
        usedAt: null as unknown as Date,
      },
    );
  }
}
