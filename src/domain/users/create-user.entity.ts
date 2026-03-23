import { UserRole } from '../../users/user.schema';

export class CreateUser {
  email: string;

  password: string;

  role: UserRole;
}
