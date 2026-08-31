import { InvalidEmailException } from '../../exceptions';

import { Email } from '../email.vo';

describe('emailVo', () => {
  describe('create', () => {
    it('deberia lanzar InvalidEmailException si el email es un string vacio', () => {
      expect(() => Email.create('')).toThrow(InvalidEmailException);
    });

    it('deberia lanzar InvalidEmailException si el email no tiene un formato valido', () => {
      expect(() => Email.create('jhon.doe')).toThrow(InvalidEmailException);
    });

    it('deberia crear el value object cuando el email es válido', () => {
      const email = Email.create('jhon.doe@example.com');

      expect(email).toBeInstanceOf(Email);
      expect(email.toString()).toBe('jhon.doe@example.com');
    });
  });
});
