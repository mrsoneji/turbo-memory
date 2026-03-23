import { UserEntity } from '../users/user.entity';

export class AuthResponse {
  accessToken: string;

  user: UserEntity;
}
