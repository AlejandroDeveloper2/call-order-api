import { User } from './user.entity';

describe('User', () => {
  describe('create', () => {
    it('deberia crear un usuario con los datos esperados', () => {
      // Arrange
      const userId = 'user-id';
      const fullname = 'Ana García';
      const roleId = 'role-id';
      const avatar = 'avatar-url';
      const phone = '3001234567';
      const isActive = false;

      // Act
      const user = User.create(
        userId,
        fullname,
        roleId,
        avatar,
        phone,
        isActive,
      );

      // Assert
      expect(user).toBeInstanceOf(User);
      expect(user.getUserId).toBe(userId);
      expect(user.getFullname).toBe(fullname);
      expect(user.getRoleId).toBe(roleId);
      expect(user.getAvatar).toBe(avatar);
      expect(user.getPhone).toBe(phone);
      expect(user.getIsActive).toBe(isActive);
    });
  });

  describe('toggleState', () => {
    it('deberia cambiar el estado activo del usuario', () => {
      // Arrange
      const user = User.create(
        'user-id',
        'Ana García',
        'role-id',
        undefined,
        undefined,
        true,
      );

      // Act
      user.toggleState(false);

      // Assert
      expect(user.getIsActive).toBe(false);
    });
  });

  describe('defaults', () => {
    it('deberia inicializar con estado activo por defecto cuando no se especifica', () => {
      // Arrange
      const userId = 'user-id';
      const fullname = 'Ana García';
      const roleId = 'role-id';

      // Act
      const user = User.create(userId, fullname, roleId);

      // Assert
      expect(user.getAvatar).toBeUndefined();
      expect(user.getPhone).toBeUndefined();
      expect(user.getIsActive).toBe(true);
    });
  });
});
