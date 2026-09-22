import { Permission } from './permission.entity';

describe('Permission', () => {
  describe('constructor', () => {
    it('deberia crear una permiso con los datos esperados', () => {
      // Arrange
      const permissionId = 'permission-id';
      const code = 'users:read';
      const description = 'Permite consultar usuarios';

      // Act
      const permission = new Permission(permissionId, code, description);

      // Assert
      expect(permission).toBeInstanceOf(Permission);
      expect(permission.permissionId).toBe(permissionId);
      expect(permission.code).toBe(code);
      expect(permission.description).toBe(description);
    });
  });
});
