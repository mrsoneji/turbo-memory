import { UserRole } from '../../users/user.schema';

export class UserEntity {
  id: string;

  email: string;

  role: UserRole;
}
