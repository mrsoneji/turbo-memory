import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../users/user.schema';

export class UserResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole })
  role: UserRole;
}
