import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'OTP code sent to email', example: '123456' })
  @IsString()
  @Length(6, 6)
  otp: string;

  @ApiProperty({ description: 'New password', example: 'newSecurePassword123' })
  @IsString()
  newPassword: string;
}
