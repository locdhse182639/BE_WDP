import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class AdminUpdateCouponDto {
  @ApiProperty({ required: false, description: 'Coupon code' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ required: false, description: 'Percent value (1-100)' })
  @IsOptional()
  @Min(1)
  @Max(100)
  value?: number;

  @ApiProperty({ required: false, description: 'Mark as used' })
  @IsOptional()
  @IsBoolean()
  isUsed?: boolean;

  @ApiProperty({ required: false, description: 'Expiration date' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiProperty({ required: false, description: 'Description' })
  @IsOptional()
  @IsString()
  description?: string;
}
