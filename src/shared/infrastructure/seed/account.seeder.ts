import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { v7 as uuidv7 } from 'uuid';

/** Esquemas */
import { PostgresAccountSchema } from '../../../auth/infrastructure/persistence/postgres/schemas';
import {
  PostgresSessionSchema,
  PostgresVerificationCodeSchema,
} from '../../../auth/infrastructure/persistence/postgres/schemas';
import {
  PostgresRoleSchema,
  PostgresPermissionSchema,
  PostgresRolePermissionSchema,
  PostgresUserSchema,
} from '../../../users/infrastructure/persistence/postgres/schemas';

@Injectable()
export class AccountSeeder {
  constructor(
    @InjectRepository(PostgresAccountSchema)
    private readonly accountRepository: Repository<PostgresAccountSchema>,
    @InjectRepository(PostgresVerificationCodeSchema)
    private readonly verificationCodeRepository: Repository<PostgresVerificationCodeSchema>,
    @InjectRepository(PostgresSessionSchema)
    private readonly sessionRepository: Repository<PostgresSessionSchema>,
    @InjectRepository(PostgresUserSchema)
    private readonly userRepository: Repository<PostgresUserSchema>,
    @InjectRepository(PostgresRoleSchema)
    private readonly roleRepository: Repository<PostgresRoleSchema>,
    @InjectRepository(PostgresPermissionSchema)
    private readonly permissionRepository: Repository<PostgresPermissionSchema>,
    @InjectRepository(PostgresRolePermissionSchema)
    private readonly rolePermissionRepository: Repository<PostgresRolePermissionSchema>,
  ) {}
  async seed(): Promise<void> {
    await this.drop();

    const passwordHash1 = await bcrypt.hash('Password1234@!', 10);
    const passwordHash2 = await bcrypt.hash('Password7890@!', 10);
    const passwordHash3 = await bcrypt.hash('Password1289@!', 10);
    const passwordHash4 = await bcrypt.hash('Password1212@!', 10);

    const result = await this.roleRepository
      .createQueryBuilder()
      .insert()
      .into(PostgresRoleSchema)
      .values([
        { id: uuidv7(), name: 'Administrador' },
        { id: uuidv7(), name: 'Agente' },
      ])
      .execute();

    const roles = result.raw as PostgresRoleSchema[];

    let createAccountPermission = await this.permissionRepository.findOneBy({
      code: 'auth:create:account',
    });

    if (!createAccountPermission) {
      createAccountPermission = await this.permissionRepository.save({
        code: 'auth:create:account',
        description: 'Crear cuentas de usuario',
      });
    }

    await this.rolePermissionRepository.save({
      roleId: roles[0].id,
      permissionId: createAccountPermission.id,
    });

    const usersResult = await this.userRepository
      .createQueryBuilder()
      .insert()
      .into(PostgresUserSchema)
      .values([
        {
          id: uuidv7(),
          fullname: 'Jhon Doe',
          phone: '+573104557899',
          roleId: roles[0].id,
        },
        {
          id: uuidv7(),
          fullname: 'Tom Doe',
          phone: '+573144557810',
          roleId: roles[0].id,
        },
        {
          id: uuidv7(),
          fullname: 'Jane Doe',
          phone: '+573104557811',
          roleId: roles[1].id,
          isActive: false,
        },
        {
          id: uuidv7(),
          fullname: 'Sara Doe',
          phone: '+573124568877',
          roleId: roles[1].id,
          isActive: true,
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
          id: uuidv7(),
          email: 'jhon.doe@example.com',
          passwordHash: passwordHash1,
          profileId: users[0].id,
          failedAttempts: 0,
        },
        {
          id: uuidv7(),
          email: 'tom.doe@example.com',
          passwordHash: passwordHash2,
          profileId: users[1].id,
          failedAttempts: 5,
          lockedUntil: new Date(Date.now() + 2 * 60 * 60 * 1000),
        },
        {
          id: uuidv7(),
          email: 'jane.doe@example.com',
          passwordHash: passwordHash3,
          profileId: users[2].id,
          failedAttempts: 0,
        },
        {
          id: uuidv7(),
          email: 'sara.doe@example.com',
          passwordHash: passwordHash4,
          profileId: users[3].id,
          failedAttempts: 0,
        },
      ])
      .execute();
  }

  async drop(): Promise<void> {
    await this.verificationCodeRepository.delete({ id: Not(IsNull()) });
    await this.sessionRepository.delete({ id: Not(IsNull()) });
    await this.rolePermissionRepository.delete({ id: Not(IsNull()) });
    await this.accountRepository.delete({ id: Not(IsNull()) });
    await this.userRepository.delete({ id: Not(IsNull()) });
    await this.roleRepository.delete({ id: Not(IsNull()) });
  }
}
