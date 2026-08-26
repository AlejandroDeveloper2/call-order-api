import { IsEmail, IsString } from 'class-validator';

export class UpdateEmailDto {
  @IsString()
  @IsEmail()
  updatedEmail!: string;
}
