import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

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
  @Transform(({ value }) => value === 'true' || value === true)
  isUsed?: boolean;
}
