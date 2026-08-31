import { InvalidFullnameException } from '../../exceptions';

import { Fullname } from '../fullname.vo';

describe('FullnameVo', () => {
  describe('create', () => {
    it('debería crear el value object cuando el nombre es válido', () => {
      // Arrange
      const fullname = 'Diego Alejandro Bonilla';

      // Act
      const result = Fullname.create(fullname);

      // Assert
      expect(result).toBeInstanceOf(Fullname);
      expect(result.toString()).toBe(fullname);
    });

    it('debería normalizar espacios al inicio, final y espacios múltiples', () => {
      // Arrange
      const fullname = '   Diego   Alejandro   Bonilla   ';

      // Act
      const result = Fullname.create(fullname);

      // Assert
      expect(result.toString()).toBe('Diego Alejandro Bonilla');
    });

    it('debería lanzar InvalidFullnameException cuando el nombre está vacío', () => {
      // Arrange
      const fullname = '';

      // Act
      const act = () => Fullname.create(fullname);

      // Assert
      expect(act).toThrow(InvalidFullnameException);
    });

    it('debería lanzar InvalidFullnameException cuando contiene solamente espacios', () => {
      // Arrange
      const fullname = '     ';

      // Act
      const act = () => Fullname.create(fullname);

      // Assert
      expect(act).toThrow(InvalidFullnameException);
    });

    it('debería lanzar InvalidFullnameException cuando tiene menos de 3 caracteres', () => {
      // Arrange
      const fullname = 'Ab';

      // Act
      const act = () => Fullname.create(fullname);

      // Assert
      expect(act).toThrow(InvalidFullnameException);
    });

    it('debería lanzar InvalidFullnameException cuando supera los 100 caracteres', () => {
      // Arrange
      const fullname = 'A'.repeat(101);

      // Act
      const act = () => Fullname.create(fullname);

      // Assert
      expect(act).toThrow(InvalidFullnameException);
    });

    it('debería permitir tildes, ñ, guiones y apóstrofes', () => {
      // Arrange
      const validNames = [
        'José Pérez',
        'María José González',
        'Juan-Pablo OConnor',
        "O'Connor Smith",
        'Ángela Núñez',
      ];

      // Act & Assert
      validNames.forEach((fullname) => {
        expect(() => Fullname.create(fullname)).not.toThrow();
      });
    });

    it('debería lanzar InvalidFullnameException cuando contiene números', () => {
      // Arrange
      const fullname = 'Diego123 Bonilla';

      // Act
      const act = () => Fullname.create(fullname);

      // Assert
      expect(act).toThrow(InvalidFullnameException);
    });

    it('debería lanzar InvalidFullnameException cuando contiene caracteres especiales no permitidos', () => {
      // Arrange
      const fullname = 'Diego @ Bonilla';

      // Act
      const act = () => Fullname.create(fullname);

      // Assert
      expect(act).toThrow(InvalidFullnameException);
    });

    it('debería permitir nombres compuestos', () => {
      // Arrange
      const fullname = 'Diego Alejandro Bonilla';

      // Act
      const result = Fullname.create(fullname);

      // Assert
      expect(result.toString()).toBe(fullname);
    });
  });
});
