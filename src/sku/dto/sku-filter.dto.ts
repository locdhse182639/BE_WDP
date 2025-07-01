import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class SkuFilterDto {
  @ApiPropertyOptional({ description: 'Minimum price' })
  @IsOptional()
  @IsNumberString()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum price' })
  @IsOptional()
  @IsNumberString()
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Formulation type (comma separated)',
    enum: ['cream', 'gel', 'serum', 'foam', 'lotion'],
  })
  @IsOptional()
  @IsString()
  formulationType?: string;

  @ApiPropertyOptional({ description: 'Returnable (true/false)' })
  @IsOptional()
  @IsString()
  returnable?: string;

  @ApiPropertyOptional({
    description: 'Status (comma separated)',
    enum: ['active', 'near_expiry', 'returned', 'hidden', 'discontinued'],
  })
  @IsOptional()
  @IsString()
  status?: string;
}
