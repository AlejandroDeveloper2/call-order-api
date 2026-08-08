import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateUserDto {
  @IsUUID('4')
  accountId!: string;

  @IsUUID('4')
  roleId!: string;

  @IsString()
  @IsNotEmpty()
  fullname!: string;

  @IsString()
  phone?: string;
}
