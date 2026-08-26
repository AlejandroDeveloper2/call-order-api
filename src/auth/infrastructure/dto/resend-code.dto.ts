import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ResendCodeDto {
  @IsString()
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(6)
  expiredCode!: string;
}
