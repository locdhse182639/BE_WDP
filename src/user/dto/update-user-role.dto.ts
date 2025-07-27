import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @ApiProperty({ description: 'New role for user', example: 'admin' })
  @IsString()
  role: string;
}
