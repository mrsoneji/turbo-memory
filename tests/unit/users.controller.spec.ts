import { Test } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { CreateUserDto } from '../../src/transport/http/users/create-user.dto';
import { UpdateUserDto } from '../../src/transport/http/users/update-user.dto';
import { UserRole } from '../../src/users/user.schema';

const makeUsersService = () => ({
  listUsers: jest.fn(),
  createUser: jest.fn(),
  getUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
});

describe('UsersController', () => {
  const pipe = new ValidationPipe({ transform: true, whitelist: true });

  it('validates CreateUserDto email', async () => {
    await expect(
      pipe.transform(
        { email: 'bad', password: '12345678', role: UserRole.Admin },
        { type: 'body', metatype: CreateUserDto },
      ),
    ).rejects.toBeTruthy();
  });

  it('validates CreateUserDto password length', async () => {
    await expect(
      pipe.transform(
        { email: 'user@example.com', password: 'short', role: UserRole.Admin },
        { type: 'body', metatype: CreateUserDto },
      ),
    ).rejects.toBeTruthy();
  });

  it('validates UpdateUserDto role enum', async () => {
    await expect(
      pipe.transform(
        { role: 'superadmin' },
        { type: 'body', metatype: UpdateUserDto },
      ),
    ).rejects.toBeTruthy();
  });

  it('calls createUser with mapped fields', async () => {
    const usersService = makeUsersService();
    usersService.createUser.mockResolvedValue({ id: '1' });

    const moduleRef = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    const controller = moduleRef.get(UsersController);
    await controller.create({
      email: 'user@example.com',
      password: 'password123',
      role: UserRole.User,
    });

    expect(usersService.createUser).toHaveBeenCalledWith({
      email: 'user@example.com',
      password: 'password123',
      role: UserRole.User,
    });
  });
});
