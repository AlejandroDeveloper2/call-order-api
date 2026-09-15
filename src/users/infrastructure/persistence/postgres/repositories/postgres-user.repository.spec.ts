jest.mock('uuid', () => ({ v7: jest.fn(() => 'test-uuid') }));

import { EntityManager, Repository } from 'typeorm';

import { PersistenceException } from '../../../../../shared/infrastructure/exceptions';

import { TypeOrmTransactionContext } from '../../../../../shared/infrastructure/adapters/database/typeorm/typeorm-transaction-context.adapter';

import { UserMapper } from '../mappers/user.mapper';

import { PostgresUserRepository } from './postgres-user.repository';

describe('PostgresUserRepository', () => {
  let repository: PostgresUserRepository;
  let userRepository: jest.Mocked<Partial<Repository<never>>> & {
    manager: EntityManager;
  };
  let manager: jest.Mocked<Partial<EntityManager>>;

  beforeEach(() => {
    manager = { save: jest.fn() };
    userRepository = {
      manager: manager as unknown as EntityManager,
      findOneBy: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
    };
    repository = new PostgresUserRepository(userRepository as never);
  });

  it('deberia mapear un usuario encontrado', async () => {
    // Arrange
    const domainUser = { getUserId: 'profile-id' };
    jest.spyOn(UserMapper, 'toDomain').mockReturnValue(domainUser as never);
    (userRepository.findOneBy as jest.Mock).mockResolvedValue({
      id: 'profile-id',
    });

    // Act
    const result = await repository.findById('profile-id');

    // Assert
    expect(result).toBe(domainUser);
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: 'profile-id' });
  });

  it('deberia devolver null cuando el usuario no existe', async () => {
    // Arrange
    (userRepository.findOneBy as jest.Mock).mockResolvedValue(null);

    // Act
    const result = await repository.findById('missing-id');

    // Assert
    expect(result).toBeNull();
  });

  it('deberia crear un usuario con el manager transaccional', async () => {
    // Arrange
    const manager = { save: jest.fn() };
    const schema = { id: 'schema-id' };
    jest.spyOn(UserMapper, 'toPersistence').mockReturnValue(schema as never);
    const context = new TypeOrmTransactionContext(
      manager as unknown as EntityManager,
    );

    // Act
    await repository.create({} as never, context);

    // Assert
    expect(manager.save).toHaveBeenCalledWith(schema);
  });

  it('deberia actualizar perfil, avatar y estado', async () => {
    // Arrange
    (userRepository.update as jest.Mock)
      .mockResolvedValueOnce({ affected: 1 })
      .mockResolvedValueOnce({ affected: 0 })
      .mockResolvedValueOnce({ affected: undefined })
      .mockResolvedValueOnce({ affected: 1 });

    // Act
    const profile = await repository.updateProfile('user-id', {
      fullname: 'John Doe',
    });
    const avatar = await repository.updateAvatar('user-id', 'avatar-url');
    const activated = await repository.activate('user-id');
    const deactivated = await repository.deactivate('user-id');

    // Assert
    expect(profile).toBe(1);
    expect(avatar).toBe(0);
    expect(activated).toBe(0);
    expect(deactivated).toBe(1);
    expect(userRepository.update).toHaveBeenNthCalledWith(
      2,
      { id: 'user-id' },
      { avatar: 'avatar-url' },
    );
  });

  it('deberia convertir errores del repositorio a PersistenceException', async () => {
    // Arrange
    (userRepository.findOneBy as jest.Mock).mockRejectedValue(
      new Error('database error'),
    );

    // Act
    const result = repository.findById('user-id');

    // Assert
    await expect(result).rejects.toThrow(PersistenceException);
  });
});
