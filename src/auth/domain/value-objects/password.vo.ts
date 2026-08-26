import { InvalidPasswordException } from '../exceptions';

export class Password {
  constructor(private readonly value: string) {}

  static create(password: string): Password {
    if (!password || password.length === 0)
      throw new InvalidPasswordException('La contraseña no puede ir vacia');
    if (password.length < 8 || password.length > 50)
      throw new InvalidPasswordException(
        'La contraseña debe tener minimo 8 caracteres y máximo 50',
      );

    if (!this.isValid(password))
      throw new InvalidPasswordException(
        'La contraseña debe tener al menos una letra máyuscula, una minúscula y un número',
      );
    return new Password(password);
  }

  private static isValid(password: string): boolean {
    const regex = /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/;
    return regex.test(password);
  }

  toString(): string {
    return this.value;
  }
}
