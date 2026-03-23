import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument, UserRole } from './user.schema';
import { CreateUser } from '../domain/users/create-user.entity';
import { UpdateUser } from '../domain/users/update-user.entity';
import { ConfigService } from '@nestjs/config';

export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createUser(dto: CreateUser): Promise<PublicUser> {
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) {
      throw new ConflictException('Email already exists');
    }
    const rounds = this.configService.get<number>('bcryptRounds') || 10;
    const passwordHash = await bcrypt.hash(dto.password, rounds);
    const created = await this.userModel.create({
      email: dto.email,
      passwordHash,
      role: dto.role,
    });
    return this.toPublic(created);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async listUsers(page?: number, limit?: number): Promise<PublicUser[]> {
    const safePage = page && page > 0 ? page : 1;
    const safeLimit = limit && limit > 0 ? Math.min(limit, 100) : 20;
    const docs = await this.userModel
      .find()
      .skip((safePage - 1) * safeLimit)
      .limit(safeLimit)
      .exec();
    return docs.map((doc) => this.toPublic(doc));
  }

  async getUser(id: string): Promise<PublicUser> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(user);
  }

  async updateUser(id: string, dto: UpdateUser): Promise<PublicUser> {
    const update: Partial<User> = {};
    if (dto.email) {
      update.email = dto.email;
    }
    if (dto.role) {
      update.role = dto.role;
    }
    if (dto.password) {
      const rounds = this.configService.get<number>('bcryptRounds') || 10;
      update.passwordHash = await bcrypt.hash(dto.password, rounds);
    }

    const updated = await this.userModel.findByIdAndUpdate(id, update, {
      new: true,
    });
    if (!updated) {
      throw new NotFoundException('User not found');
    }
    return this.toPublic(updated);
  }

  async deleteUser(id: string): Promise<void> {
    const res = await this.userModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('User not found');
    }
  }

  async adminExists(): Promise<boolean> {
    const admin = await this.userModel.findOne({ role: UserRole.Admin }).exec();
    return !!admin;
  }

  async setRefreshToken(userId: string, refreshTokenHash: string, expiresAt: Date) {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokenHash,
      refreshTokenExpiresAt: expiresAt,
    });
  }

  async clearRefreshToken(userId: string) {
    await this.userModel.findByIdAndUpdate(userId, {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    });
  }

  toPublic(user: UserDocument): PublicUser {
    return {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };
  }
}
