import { applyDecorators, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/** Guards */
import { PermissionsGuard } from '../guards/permissions.guard';
/** Decoradores */
import { Permissions } from './permissions.decorator';

export function Auth(...permissions: string[]) {
  return applyDecorators(
    UseGuards(AuthGuard('jwt'), PermissionsGuard),
    Permissions(...permissions),
  );
}
