import { InvalidEmailException } from '../exceptions';

export class Email {
  constructor(private readonly value: string) {}

  static create(email: string): Email {
    if (!email || email.trim().length === 0)
      throw new InvalidEmailException('El email no puede estar vacio');

    const normalized = email.toLowerCase().trim();

    if (!this.isValid(normalized))
      throw new InvalidEmailException(
        `El email ingresado es invalido, ${email}`,
      );

    return new Email(normalized);
  }

  private static isValid(email: string): boolean {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  toString(): string {
    return this.value;
  }
}
