import { InvalidPhoneException } from '../../exceptions';

import { Phone } from '../phone.vo';

describe('PhoneVo', () => {
  describe('create', () => {
    it('deberia crear el value object cuando el teléfono es valido ', () => {
      // Arrange
      const phone = '3105073188';

      // Act
      const result = Phone.create(phone);

      // Assert
      expect(result).toBeInstanceOf(Phone);
      expect(result.toString()).toBe(`+57${phone}`);
    });

    it('debería normalizar espacios al inicio, final y espacios múltiples', () => {
      // Arrange
      const phone = '   3105073199   ';

      // Act
      const result = Phone.create(phone);

      // Assert
      expect(result.toString()).toBe('+573105073199');
    });

    it('debería lanzar InvalidPhoneException cuando el teléfono está vacío', () => {
      // Arrange
      const phone = '';

      // Act
      const act = () => Phone.create(phone);

      // Assert
      expect(act).toThrow(InvalidPhoneException);
    });

    it('debería lanzar InvalidPhoneException cuando el teléfono tiene un formato invalido para colombia', () => {
      // Arrange
      const invalidPhones = ['+87451616', '545445sd', '345788', 'hfhdj32545'];

      // Act & assert
      invalidPhones.forEach((phone) => {
        expect(() => Phone.create(phone)).toThrow(InvalidPhoneException);
      });
    });
  });
});
