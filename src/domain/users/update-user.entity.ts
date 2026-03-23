import { UserRole } from '../../users/user.schema';

export class UpdateUser {
  email?: string;

  password?: string;

  role?: UserRole;
}
