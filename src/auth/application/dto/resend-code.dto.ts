import {
  IsEmail,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ResendCodeDto {
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @IsUUID()
  accountId!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  expiredCode!: string;
}
