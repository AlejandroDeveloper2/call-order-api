import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsString,
  IsEmail,
  IsUUID,
  IsIn,
} from 'class-validator';

import type { UserStatusType } from '../../../users/domain/types';

export class FindAccountsQueryDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  offset?: number;

  @IsOptional()
  @IsString()
  @IsIn(['active', 'inactive'])
  status?: UserStatusType;

  @IsOptional()
  @IsString()
  fullname?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  roleId?: string;
}
