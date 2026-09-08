import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

/** Esquemas */
import { PostgresAccountSchema } from '../../../auth/infrastructure/persistence/postgres/schemas';
import { PostgresVerificationCodeSchema } from '../../../auth/infrastructure/persistence/postgres/schemas';
import {
  PostgresRoleSchema,
  PostgresUserSchema,
} from '../../../users/infrastructure/persistence/postgres/schemas';

@Injectable()
export class AccountSeeder {
  constructor(
    @InjectRepository(PostgresAccountSchema)
    private readonly accountRepository: Repository<PostgresAccountSchema>,
    @InjectRepository(PostgresVerificationCodeSchema)
    private readonly verificationCodeRepository: Repository<PostgresVerificationCodeSchema>,
    @InjectRepository(PostgresUserSchema)
    private readonly userRepository: Repository<PostgresUserSchema>,
    @InjectRepository(PostgresRoleSchema)
    private readonly roleRepository: Repository<PostgresRoleSchema>,
  ) {}
  async seed(): Promise<void> {
    await this.drop();

    const passwordHash1 = await bcrypt.hash('Password1234@!', 10);
    const passwordHash2 = await bcrypt.hash('Password7890@!', 10);
    const passwordHash3 = await bcrypt.hash('Password1289@!', 10);

    const result = await this.roleRepository
      .createQueryBuilder()
      .insert()
      .into(PostgresRoleSchema)
      .values([
        { id: uuidv4(), name: 'Administrador' },
        { id: uuidv4(), name: 'Agente' },
      ])
      .execute();

    const roles = result.raw as PostgresRoleSchema[];

    const usersResult = await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(PostgresUserSchema)
      .values([
        {
          id: uuidv4(),
          fullname: 'Jhon Doe',
          phone: '+573104557899',
          roleId: roles[0].id,
        },
        {
          id: uuidv4(),
          fullname: 'Tom Doe',
          phone: '+573144557810',
          roleId: roles[0].id,
        },
        {
          id: uuidv4(),
          fullname: 'Jane Doe',
          phone: '+573104557811',
          roleId: roles[1].id,
          isActive: false,
        },
      ])
      .execute();

    const users = usersResult.raw as PostgresUserSchema[];

    await this.accountRepository
      .createQueryBuilder()
      .insert()
      .into(PostgresAccountSchema)
      .values([
        {
          id: uuidv4(),
          email: 'jhon.doe@example.com',
          passwordHash: passwordHash1,
          profileId: users[0].id,
          failedAttempts: 0,
        },
        {
          id: uuidv4(),
          email: 'tom.doe@example.com',
          passwordHash: passwordHash2,
          profileId: users[1].id,
          failedAttempts: 5,
          lockedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
        {
          id: uuidv4(),
          email: 'jane.doe@example.com',
          passwordHash: passwordHash3,
          profileId: users[2].id,
          failedAttempts: 0,
        },
      ])
      .execute();
  }

  async drop(): Promise<void> {
    await this.verificationCodeRepository.delete({ id: Not(IsNull()) });
    await this.accountRepository.delete({ id: Not(IsNull()) });
    await this.userRepository.delete({ id: Not(IsNull()) });
    await this.roleRepository.delete({ id: Not(IsNull()) });
  }
}
