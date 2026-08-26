import { InvalidCodeFormatException } from '../exceptions';

export class Code {
  constructor(private readonly value: string) {}

  static create(code: string): Code {
    if (!code || code.length === 0)
      throw new InvalidCodeFormatException('El código no debe estar vacio');

    if (code.length !== 6)
      throw new InvalidCodeFormatException('El código debe ser de 6 digitos');

    if (!this.isValid(code))
      throw new InvalidCodeFormatException(
        'El código solo puede contener caracteres númericos',
      );

    return new Code(code);
  }

  private static isValid(code: string): boolean {
    const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    let validCharacters: number = 0;

    for (let i = 0; i < code.length; i++) {
      const digit = code.charAt(i);
      if (digits.includes(digit)) validCharacters += 1;
    }

    return validCharacters === code.length;
  }

  toString(): string {
    return this.value;
  }
}
