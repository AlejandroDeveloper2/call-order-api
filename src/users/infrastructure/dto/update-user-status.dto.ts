import { IsIn, IsString } from 'class-validator';

import type { UserStatusType } from '../../domain/types';

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(['active', 'inactive'])
  status!: UserStatusType;
}
