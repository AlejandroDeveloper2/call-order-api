import { Role } from './role.entity';

describe('Role', () => {
  describe('constructor', () => {
    it('deberia crear un rol con los datos esperados', () => {
      // Arrange
      const roleId = 'role-id';
      const name = 'Administrador';

      // Act
      const role = new Role(roleId, name);

      // Assert
      expect(role).toBeInstanceOf(Role);
      expect(role.roleId).toBe(roleId);
      expect(role.name).toBe(name);
    });
  });

  describe('name', () => {
    it('deberia permitir actualizar el nombre del rol', () => {
      // Arrange
      const role = new Role('role-id', 'Administrador');

      // Act
      role.name = 'Editor';

      // Assert
      expect(role.name).toBe('Editor');
    });
  });
});
