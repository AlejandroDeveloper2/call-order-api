import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import { v7 as uuidv7 } from 'uuid';

/** Esquemas */
import {
  PostgresAccountSchema,
  PostgresSessionSchema,
  PostgresVerificationCodeSchema,
} from '../../../auth/infrastructure/persistence/postgres/schemas';
import {
  PostgresPermissionSchema,
  PostgresRolePermissionSchema,
  PostgresRoleSchema,
  PostgresUserSchema,
} from '../../../users/infrastructure/persistence/postgres/schemas';

type PermissionTest = {
  code: string;
  description: string;
  roleId: string;
};
type PermissionWithRoleName = Omit<PermissionTest, 'roleId'> & {
  role: string;
};

@Injectable()
export class AuthSeeder {
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
  private async hashPasswords(plainPasswords: string[]): Promise<string[]> {
    return Promise.all(
      plainPasswords.map(
        async (plainPassword) => await bcrypt.hash(plainPassword, 10),
      ),
    );
  }

  private async saveAccountPermission(
    permission: PermissionTest,
  ): Promise<void> {
    const { code, description, roleId } = permission;

    // verificar si existe el permiso
    let createAccountPermission = await this.permissionRepository.findOneBy({
      code,
    });

    // Si no existe lo crea
    if (!createAccountPermission) {
      createAccountPermission = await this.permissionRepository.save({
        id: uuidv7(),
        code,
        description,
      });
    }

    // Finalmente se crea y asigna el permiso a un rol de usuario especifico
    await this.rolePermissionRepository.save({
      id: uuidv7(),
      roleId,
      permissionId: createAccountPermission.id,
    });
  }

  async seed(permissions?: PermissionWithRoleName[]): Promise<void> {
    await this.drop();

    // Encriptamos las contraseñas de prueba
    const [passwordHash1, passwordHash2, passwordHash3, passwordHash4] =
      await this.hashPasswords([
        'Password1234@!',
        'Password7890@!',
        'Password1289@!',
        'Password1212@!',
      ]);

    // Creación de roles de prueba
    const result = await this.roleRepository
      .createQueryBuilder()
      .insert()
      .into(PostgresRoleSchema)
      .values([
        { id: uuidv7(), name: 'Administrador' },
        { id: uuidv7(), name: 'Agente' },
        { id: uuidv7(), name: 'Vendedor' },
      ])
      .execute();

    const roles = result.raw as PostgresRoleSchema[];

    // Creación de permisos si es requerido
    if (permissions) {
      const permissionsWithRole: PermissionTest[] = permissions.map(
        (permission) => {
          if (permission.role === 'Administrador')
            return { ...permission, roleId: roles[0].id };
          if (permission.role === 'Agente')
            return { ...permission, roleId: roles[1].id };
          return { ...permission, roleId: roles[2].id };
        },
      );

      await Promise.all(
        permissionsWithRole.map(
          async (permission) => await this.saveAccountPermission(permission),
        ),
      );
    }

    // Creación de perfiles de usuario
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

    // Creamos las cuentas de usuario
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

  /** Roles */
  async getRoleById(roleId: string): Promise<PostgresRoleSchema | null> {
    const role = await this.roleRepository.findOneBy({ id: roleId });
    return role;
  }

  async getAllRoles(): Promise<PostgresRoleSchema[]> {
    const roles = await this.roleRepository.find({
      order: { name: 'ASC' },
    });
    return roles;
  }

  /** Sesiones */
  async updateSessionByEmail(
    email: string,
    dataToUpdate: Partial<PostgresSessionSchema>,
    isExpired?: boolean,
  ): Promise<void> {
    const account = await this.accountRepository.findOneBy({ email });

    if (!account) return;

    await this.sessionRepository.update(
      {
        accountId: account.id,
        expiresAt: isExpired ? Not(IsNull()) : IsNull(),
      },
      dataToUpdate,
    );
  }

  async updateCodeByEmail(
    email: string,
    dataToUpdate: Partial<PostgresVerificationCodeSchema>,
    isExpired?: boolean,
    isUsed?: boolean,
  ): Promise<void> {
    const account = await this.accountRepository.findOneBy({ email });

    if (!account) return;

    await this.verificationCodeRepository.update(
      {
        accountId: account.id,
        usedAt: isUsed ? Not(IsNull()) : IsNull(),
        expiresAt: isExpired ? Not(IsNull()) : IsNull(),
      },
      dataToUpdate,
    );
  }

  async drop(): Promise<void> {
    await Promise.allSettled([
      this.verificationCodeRepository.delete({ id: Not(IsNull()) }),
      this.sessionRepository.delete({ id: Not(IsNull()) }),
      this.rolePermissionRepository.delete({ id: Not(IsNull()) }),
      this.accountRepository.delete({ id: Not(IsNull()) }),
      this.userRepository.delete({ id: Not(IsNull()) }),
      this.roleRepository.delete({ id: Not(IsNull()) }),
    ]);
  }
}
