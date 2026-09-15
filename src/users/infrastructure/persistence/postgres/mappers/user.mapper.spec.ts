import { User } from '../../../../domain/entities';

import { PostgresUserSchema } from '../schemas/postgres-user.schema';

import { UserMapper } from './user.mapper';

describe('UserMapper', () => {
  it('deberia convertir un schema de usuario al dominio', () => {
    // Arrange
    const schema = Object.assign(new PostgresUserSchema(), {
      id: 'user-id',
      fullname: 'John Doe',
      roleId: 'role-id',
      avatar: 'avatar-url',
      phone: '3000000000',
      isActive: true,
    });

    // Act
    const result = UserMapper.toDomain(schema);

    // Assert
    expect(result).toBeInstanceOf(User);
    expect(result.getUserId).toBe('user-id');
    expect(result.getFullname).toBe('John Doe');
    expect(result.getRoleId).toBe('role-id');
    expect(result.getAvatar).toBe('avatar-url');
    expect(result.getPhone).toBe('3000000000');
    expect(result.getIsActive).toBe(true);
  });

  it('deberia convertir un usuario de dominio al schema de persistencia', () => {
    // Arrange
    const user = User.create(
      'user-id',
      'John Doe',
      'role-id',
      'avatar-url',
      '3000000000',
      true,
    );

    // Act
    const result = UserMapper.toPersistence(user);

    // Assert
    expect(result).toBeInstanceOf(PostgresUserSchema);
    expect(result).toMatchObject({
      id: 'user-id',
      fullname: 'John Doe',
      roleId: 'role-id',
      avatar: 'avatar-url',
      phone: '3000000000',
      isActive: true,
    });
  });

  it('deberia conservar los datos opcionales indefinidos', () => {
    // Arrange
    const user = User.create('user-id', 'John Doe', 'role-id');

    // Act
    const result = UserMapper.toPersistence(user);

    // Assert
    expect(result.avatar).toBeUndefined();
    expect(result.phone).toBeUndefined();
    expect(result.isActive).toBe(true);
  });
});
