import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Post,
  Query,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto } from '../transport/http/users/create-user.dto';
import { UpdateUserDto } from '../transport/http/users/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './user.schema';
import { UserResponseDto } from '../transport/http/users/user-response.dto';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.Admin)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'List users (admin only)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'List of users', type: UserResponseDto, isArray: true })
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page, 10) : undefined;
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    return this.usersService.listUsers(pageNum, limitNum);
  }

  @Post()
  @ApiOperation({ summary: 'Create a user (admin only)' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.createUser({
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a user by id (admin only)' })
  @ApiResponse({ status: 200, description: 'User', type: UserResponseDto })
  get(@Param('id') id: string) {
    return this.usersService.getUser(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a user (admin only)' })
  @ApiResponse({ status: 200, description: 'User updated', type: UserResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.updateUser(id, {
      email: dto.email,
      password: dto.password,
      role: dto.role,
    });
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a user (admin only)' })
  @ApiResponse({ status: 204, description: 'Deleted' })
  async remove(@Param('id') id: string) {
    await this.usersService.deleteUser(id);
  }
}
