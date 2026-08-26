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

import type { UserStatusType } from '../../domain/types';

export class UserQueryDto {
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
  @IsUUID('4')
  roleId?: string;
}
