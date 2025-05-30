import {
  Body,
  Controller,
  Get,
  Post,
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

@Controller('user')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(@Body() dto: CreateUserDto) {
    const user = await this.userService.register(dto);
    console.log('User registered:', user);
    return { message: 'User registered successfully', user };
  }

  @Post('login')
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
  getMe(@CurrentUser() user: JwtPayload) {
    return user;
  }
}
