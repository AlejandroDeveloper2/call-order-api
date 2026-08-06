import { Type } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsPositive,
  Min,
  IsEnum,
  IsString,
  IsEmail,
  IsUUID,
} from 'class-validator';

import { UserStatus } from '../../domain/types';

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
  @IsEnum(UserStatus)
  status?: UserStatus;

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
