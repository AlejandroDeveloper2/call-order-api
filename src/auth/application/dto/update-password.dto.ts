import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class UpdatePasswordDto {
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe tener al menos una letra máyuscula, una minúscula y un número',
  })
  newPassword!: string;
}
