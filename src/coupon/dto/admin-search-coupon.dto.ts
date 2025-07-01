import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';

export class AdminSearchCouponDto {
  @ApiPropertyOptional({ description: 'Coupon code (partial match)' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'User email (partial match)' })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ description: 'Is used' })
  @IsOptional()
  @IsBoolean()
  isUsed?: boolean;
}
