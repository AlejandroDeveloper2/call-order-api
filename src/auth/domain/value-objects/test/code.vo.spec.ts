import { InvalidCodeFormatException } from '../../exceptions';

import { Code } from '../code.vo';

describe('CodeVo', () => {
  describe('create', () => {
    it('debería lanzar InvalidCodeFormatException cuando el código está vacío', () => {
      expect(() => Code.create('')).toThrow(InvalidCodeFormatException);
    });

    it('debería lanzar InvalidCodeFormatException cuando el código no tiene 6 dígitos', () => {
      expect(() => Code.create('12345')).toThrow(InvalidCodeFormatException);
    });

    it('debería lanzar InvalidCodeFormatException cuando contiene caracteres no numéricos', () => {
      expect(() => Code.create('1234AX')).toThrow(InvalidCodeFormatException);
    });

    it('debería crear el value object cuando el código es válido', () => {
      const code = Code.create('123456');

      expect(code).toBeInstanceOf(Code);
      expect(code.toString()).toBe('123456');
    });
  });
});
