import { InvalidPhoneException } from '../exceptions';

export class Phone {
  private static readonly COUNTRY_CODE = '+57';

  /**
   * Formato interno:
   * +573001234567
   */
  private constructor(private readonly value: string) {}

  static create(phone: string): Phone {
    const normalizedPhone = phone.trim();

    if (!normalizedPhone)
      throw new InvalidPhoneException('El teléfono no puede ir vacío');

    const normalized = this.normalize(normalizedPhone);

    if (!this.isValid(normalized))
      throw new InvalidPhoneException('El teléfono no es válido para Colombia');

    return new Phone(normalized);
  }

  private static normalize(phone: string): string {
    // Elimina espacios, guiones, paréntesis y puntos.
    const cleaned = phone.replace(/[\s\-().]/g, '');

    // 3001234567 -> +573001234567
    if (/^3\d{9}$/.test(cleaned)) {
      return `${this.COUNTRY_CODE}${cleaned}`;
    }

    // 573001234567 -> +573001234567
    if (/^57\d{10}$/.test(cleaned)) {
      return `+${cleaned}`;
    }

    // +573001234567 -> +573001234567
    return cleaned;
  }

  private static isValid(phone: string): boolean {
    return /^\+573\d{9}$/.test(phone);
  }

  toString(): string {
    return this.value;
  }

  equals(other: Phone): boolean {
    return this.value === other.value;
  }
}
