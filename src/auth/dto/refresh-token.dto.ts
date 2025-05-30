import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {

  @IsString()
  @ApiProperty({ example: 'your-refresh-token' })
  refreshToken: string;
}
