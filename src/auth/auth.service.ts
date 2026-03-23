import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService, PublicUser } from '../users/users.service';
import { UserRole } from '../users/user.schema';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async bootstrapAdmin(email: string, password: string, token: string): Promise<PublicUser> {
    const expected = this.configService.get<string>('bootstrapToken');
    if (!expected || token !== expected) {
      throw new UnauthorizedException('Invalid bootstrap token');
    }
    const adminExists = await this.usersService.adminExists();
    if (adminExists) {
      throw new ConflictException('Admin already exists');
    }
    return this.usersService.createUser({ email, password, role: UserRole.Admin });
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      return null;
    }
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }
    return user;
  }

  private getUserPayload(user: { _id?: unknown; id?: string; role: string; email: string }) {
    const id = user._id ? user._id.toString() : user.id;
    if (!id) {
      throw new UnauthorizedException('Invalid user id');
    }
    return { sub: id, role: user.role, email: user.email };
  }

  private async signAccessToken(user: { _id?: unknown; id?: string; role: string; email: string }) {
    const payload = this.getUserPayload(user);
    return this.jwtService.signAsync(payload);
  }

  private async signRefreshToken(user: { _id?: unknown; id?: string; role: string; email: string }) {
    const payload = this.getUserPayload(user);
    const secret = this.configService.get<string>('refreshSecret');
    const refreshExpiresSeconds = this.configService.get<number>('refreshExpiresSeconds') || 180;
    return this.jwtService.signAsync(payload, { secret, expiresIn: `${refreshExpiresSeconds}s` });
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    const accessToken = await this.signAccessToken(user);
    const refreshToken = await this.signRefreshToken(user);
    const rounds = this.configService.get<number>('bcryptRounds') || 10;
    const refreshTokenHash = await bcrypt.hash(refreshToken, rounds);
    const refreshExpiresSeconds = this.configService.get<number>('refreshExpiresSeconds') || 180;
    const expiresAt = new Date(Date.now() + refreshExpiresSeconds * 1000);
    await this.usersService.setRefreshToken(user._id.toString(), refreshTokenHash, expiresAt);
    return {
      accessToken,
      refreshToken,
      user: this.usersService.toPublic(user),
    };
  }

  async refresh(refreshToken: string) {
    const secret = this.configService.get<string>('refreshSecret');
    let payload: { sub: string; role: string; email: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, { secret });
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.usersService.findById(payload.sub);
    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiresAt) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired');
    }
    const isMatch = await bcrypt.compare(refreshToken, user.refreshTokenHash);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.signAccessToken(user);
    const newRefreshToken = await this.signRefreshToken(user);
    const rounds = this.configService.get<number>('bcryptRounds') || 10;
    const refreshTokenHash = await bcrypt.hash(newRefreshToken, rounds);
    const refreshExpiresSeconds = this.configService.get<number>('refreshExpiresSeconds') || 180;
    const expiresAt = new Date(Date.now() + refreshExpiresSeconds * 1000);
    await this.usersService.setRefreshToken(user._id.toString(), refreshTokenHash, expiresAt);

    return {
      accessToken,
      refreshToken: newRefreshToken,
      user: this.usersService.toPublic(user),
    };
  }
}
