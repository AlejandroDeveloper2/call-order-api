import { IsString, IsUUID, Length, IsOptional } from 'class-validator';

export class ValidateIdentityDto {
  @IsString()
  @Length(6, 6)
  verificationCode!: string;

  @IsString()
  @IsUUID()
  accountId!: string;

  @IsOptional()
  @IsString()
  browser?: string;

  @IsOptional()
  @IsString()
  operatingSystem?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;

  @IsOptional()
  @IsString()
  deviceType?: string;
}
