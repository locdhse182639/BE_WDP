import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { AuthService } from '@/auth/auth.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { RoleGuard } from '@/common/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RefreshTokenDto } from '@/auth/dto/refresh-token.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiUnauthorizedResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  async register(@Body() dto: CreateUserDto) {
    const user = await this.userService.register(dto);
    console.log('User registered:', user);
    return { message: 'User registered successfully', user };
  }

  @Post('login')
  @ApiOperation({ summary: 'Login and receive access & refresh tokens' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials' })
  async login(@Body() dto: LoginUserDto) {
    const user = await this.userService.validateUser(dto.email, dto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user info (admin only)' })
  @ApiResponse({ status: 200, description: 'User info returned successfully' })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access and refresh tokens' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  @ApiUnauthorizedResponse({ description: 'Invalid refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Get()
  @ApiOperation({ summary: 'Get all users with pagination' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  getAll(@Query() query: PaginationQueryDto) {
    return this.userService.findAll(query);
  }
}
