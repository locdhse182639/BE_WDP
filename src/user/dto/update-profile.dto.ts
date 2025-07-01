import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsPhoneNumber, IsEnum } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsPhoneNumber('VN')
  phone?: string;

  @ApiPropertyOptional({
    enum: ['normal', 'dry', 'oily', 'combination', 'sensitive'],
  })
  @IsOptional()
  @IsEnum(['normal', 'dry', 'oily', 'combination', 'sensitive'])
  skinType?: string;
}
