import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ example: 'admin@admin.com' })
  @IsEmail({}, { message: 'Invalid email address' })
  email: string;

  @ApiProperty({ example: '123456' })
  @IsNotEmpty({ message: 'Email is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;
}
