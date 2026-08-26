/** Tipos */
import { AccessTokenPayload } from '../../../domain/types';

/** Puertos */
import { PermissionRepositoryPort } from '../../../../users/domain/ports';
import { AccountRepositoryPort } from '../../../domain/ports';

/** Errores */
import {
  AccountLockedException,
  AccountNotFoundException,
  InactiveAccountException,
} from '../../exceptions';

export class ValidateAccessTokenUseCase {
  constructor(
    private readonly accountRepository: AccountRepositoryPort,
    private readonly permissionRepository: PermissionRepositoryPort,
  ) {}

  async run(
    payload: AccessTokenPayload,
  ): Promise<AccessTokenPayload & { permissions: string[] }> {
    const account = await this.accountRepository.findForTokenValidation(
      payload.accountId,
    );

    if (!account)
      throw new AccountNotFoundException(
        'El token no está asociado a ninguna cuenta registrada',
      );

    if (account.lockedUntil && new Date() < account.lockedUntil)
      throw new AccountLockedException('La cuenta se encuentra bloqueada');

    if (!account.profile.isActive)
      throw new InactiveAccountException('La cuenta no está activa');

    const permissions = await this.permissionRepository.findPermissionsByRoleId(
      account.profile.roleId,
    );

    return {
      accountId: account.accountId,
      profileId: account.profile.profileId,
      roleId: account.profile.roleId,
      permissions: permissions.map((permission) => permission.code),
    };
  }
}
