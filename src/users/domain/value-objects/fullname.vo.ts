import { InvalidFullnameException } from '../exceptions';

export class Fullname {
  constructor(private readonly value: string) {}

  static create(fullname: string): Fullname {
    if (!fullname || fullname.length === 0)
      throw new InvalidFullnameException(
        'El nombre del usuario no puede ir vacio',
      );

    if (fullname.length < 3)
      throw new InvalidFullnameException(
        'El nombre del usuario debe tener al menos 3 caracteres',
      );

    return new Fullname(fullname);
  }

  toString(): string {
    return this.value;
  }
}
