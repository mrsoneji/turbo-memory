import { AuthService } from '../../src/auth/auth.service';
import { UserRole } from '../../src/users/user.schema';

jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockResolvedValue('hash'),
}));

const makeUsersService = () => ({
  adminExists: jest.fn(),
  createUser: jest.fn(),
  findByEmail: jest.fn(),
  findById: jest.fn(),
  setRefreshToken: jest.fn(),
  toPublic: jest.fn().mockImplementation((u: any) => ({
    id: u._id,
    email: u.email,
    role: u.role,
  })),
});

const makeJwtService = () => ({
  signAsync: jest.fn().mockResolvedValue('token'),
  verifyAsync: jest.fn().mockResolvedValue({ sub: '1', email: 'a', role: UserRole.User }),
});

const makeConfigService = (token = 'boot') => ({
  get: jest.fn().mockImplementation((key: string) => {
    if (key === 'bootstrapToken') return token;
    return undefined;
  }),
});

describe('AuthService', () => {
  it('bootstraps admin when token matches and no admin exists', async () => {
    const usersService = makeUsersService();
    usersService.adminExists.mockResolvedValue(false);
    usersService.createUser.mockResolvedValue({ id: '1', email: 'a', role: UserRole.Admin });

    const service = new AuthService(
      usersService as any,
      makeJwtService() as any,
      makeConfigService('secret') as any,
    );

    const result = await service.bootstrapAdmin('a', 'p', 'secret');
    expect(usersService.createUser).toHaveBeenCalled();
    expect(result.role).toBe(UserRole.Admin);
  });

  it('login returns token and user', async () => {
    const usersService = makeUsersService();
    usersService.findByEmail.mockResolvedValue({ _id: '1', email: 'a', role: UserRole.User, passwordHash: '$2b$10$' });
    const jwtService = makeJwtService();

    const service = new AuthService(usersService as any, jwtService as any, makeConfigService() as any);
    const result = await service.login('a', 'password');
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
  });

  it('refresh returns new tokens', async () => {
    const usersService = makeUsersService();
    usersService.findByEmail.mockResolvedValue(null);
    usersService.findById = jest.fn().mockResolvedValue({
      _id: '1',
      email: 'a',
      role: UserRole.User,
      refreshTokenHash: 'hash',
      refreshTokenExpiresAt: new Date(Date.now() + 10000),
    });

    const jwtService = makeJwtService();
    const service = new AuthService(usersService as any, jwtService as any, makeConfigService() as any);
    const result = await service.refresh('token');
    expect(result.accessToken).toBe('token');
    expect(result.refreshToken).toBe('token');
  });
});
