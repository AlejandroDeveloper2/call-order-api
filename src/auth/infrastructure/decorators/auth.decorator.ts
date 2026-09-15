import { applyDecorators, UseGuards } from '@nestjs/common';

/** Guards */
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionsGuard } from '../guards/permissions.guard';
/** Decoradores */
import { Permissions } from './permissions.decorator';

export function Auth(...permissions: string[]) {
  return applyDecorators(
    UseGuards(JwtAuthGuard, PermissionsGuard),
    Permissions(...permissions),
  );
}
