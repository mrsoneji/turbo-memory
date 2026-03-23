import { UsersService } from '../../src/users/users.service';
import { UserRole } from '../../src/users/user.schema';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hash'),
}));

const makeUserModel = () => {
  const model: any = {
    findOne: jest.fn(),
    create: jest.fn(),
    findById: jest.fn(),
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
  };
  return model;
};

const makeConfigService = (rounds = 4) => ({
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'bcryptRounds') return rounds;
    return undefined;
  }),
});

describe('UsersService', () => {
  it('creates user with hashed password', async () => {
    const model = makeUserModel();
    model.findOne.mockReturnValue({ exec: () => null });
    model.create.mockResolvedValue({
      _id: 'id1',
      email: 'a@a.com',
      role: UserRole.Admin,
    });

    const service = new UsersService(model, makeConfigService() as any);
    const result = await service.createUser({
      email: 'a@a.com',
      password: 'secret123',
      role: UserRole.Admin,
    });

    expect(model.create).toHaveBeenCalled();
    expect(result.email).toBe('a@a.com');
    expect(result.role).toBe(UserRole.Admin);
  });

  it('lists users with defaults', async () => {
    const model = makeUserModel();
    model.find.mockReturnValue({
      skip: () => ({
        limit: () => ({ exec: () => [{ _id: '1', email: 'a', role: UserRole.User }] }),
      }),
    });

    const service = new UsersService(model, makeConfigService() as any);
    const result = await service.listUsers();
    expect(result).toHaveLength(1);
  });

  it('returns admin exists true when admin found', async () => {
    const model = makeUserModel();
    model.findOne.mockReturnValue({ exec: () => ({ _id: '1' }) });
    const service = new UsersService(model, makeConfigService() as any);
    const exists = await service.adminExists();
    expect(exists).toBe(true);
  });
});
