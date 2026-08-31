import { InvalidFullnameException } from '../exceptions';

export class Fullname {
  private static readonly MIN_LENGTH = 3;
  private static readonly MAX_LENGTH = 100;

  private static readonly FULLNAME_REGEX =
    /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)+$/;

  private constructor(private readonly value: string) {}

  static create(fullname: string): Fullname {
    const normalizedFullname = this.normalize(fullname);

    this.validate(normalizedFullname);

    return new Fullname(normalizedFullname);
  }

  private static normalize(fullname: string): string {
    if (typeof fullname !== 'string') {
      throw new InvalidFullnameException(
        'El nombre completo debe ser una cadena de texto',
      );
    }

    return fullname.trim().replace(/\s+/g, ' ');
  }

  private static validate(fullname: string): void {
    if (fullname.length === 0) {
      throw new InvalidFullnameException(
        'El nombre completo no puede estar vacío',
      );
    }

    if (fullname.length < this.MIN_LENGTH) {
      throw new InvalidFullnameException(
        `El nombre completo debe tener al menos ${this.MIN_LENGTH} caracteres`,
      );
    }

    if (fullname.length > this.MAX_LENGTH) {
      throw new InvalidFullnameException(
        `El nombre completo no puede superar los ${this.MAX_LENGTH} caracteres`,
      );
    }

    if (!this.FULLNAME_REGEX.test(fullname)) {
      throw new InvalidFullnameException(
        'El nombre completo contiene caracteres no válidos o debe incluir al menos un nombre y un apellido',
      );
    }
  }

  toString(): string {
    return this.value;
  }
}
