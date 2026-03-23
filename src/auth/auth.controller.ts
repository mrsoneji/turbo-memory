import { Body, Controller, Get, Headers, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { BootstrapDto } from '../transport/http/auth/bootstrap.dto';
import { LoginDto } from '../transport/http/auth/login.dto';
import { RefreshDto } from '../transport/http/auth/refresh.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';
import { UserResponseDto } from '../transport/http/users/user-response.dto';
import { AuthResponseDto } from '../transport/http/auth/auth-response.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('bootstrap')
  @ApiOperation({ summary: 'Bootstrap initial admin (one-time)' })
  @ApiHeader({ name: 'X-Bootstrap-Token', required: true })
  @ApiResponse({ status: 201, description: 'Admin user created', type: UserResponseDto })
  bootstrap(
    @Headers('x-bootstrap-token') token: string,
    @Body() dto: BootstrapDto,
  ) {
    const normalizedToken = token?.split(',')[0]?.trim();
    return this.authService.bootstrapAdmin(dto.email, dto.password, normalizedToken);
  }

  @Post('login')
  @ApiOperation({ summary: 'Authenticate user and issue JWT' })
  @ApiResponse({ status: 200, description: 'JWT issued', type: AuthResponseDto })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'JWT refreshed', type: AuthResponseDto })
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile', type: UserResponseDto })
  async me(@CurrentUser() user: { sub: string }) {
    return this.usersService.getUser(user.sub);
  }
}
