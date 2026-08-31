import { InvalidPasswordException } from '../../exceptions';

import { Password } from '../password.vo';

describe('passwordVo', () => {
  describe('create', () => {
    it('deberia lanzar InvalidPasswordException si la contraseña es un string vacio', () => {
      expect(() => Password.create('')).toThrow(InvalidPasswordException);
    });

    it('deberia lanzar InvalidPasswordException si la contraseña tiene menos de 8 caracteres o mas de 50', () => {
      expect(() => Password.create('pass')).toThrow(InvalidPasswordException);
      expect(() =>
        Password.create(
          'pass123456789111111111111111000000001122335ssss4556s44s55s4s5s545454545454545454',
        ),
      ).toThrow(InvalidPasswordException);
    });

    it('deberia lanzar InvalidPasswordException si la contraseña no tiene el formato requerido', () => {
      expect(() => Password.create('pass1')).toThrow(InvalidPasswordException);
    });

    it('deberia crear el value object cuando la contraseña es válida', () => {
      const password = Password.create('Pass4567@');

      expect(password).toBeInstanceOf(Password);
      expect(password.toString()).toBe('Pass4567@');
    });
  });
});
