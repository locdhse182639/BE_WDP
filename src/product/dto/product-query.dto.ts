import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class ProductQueryDto {
  @ApiPropertyOptional({ description: 'Page number', example: 1 })
  @IsOptional()
  @IsNumberString()
  page?: number;

  @ApiPropertyOptional({ description: 'Page size', example: 10 })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({ description: 'Product name (partial match)' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Brand (partial match)' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Ingredients (comma separated)' })
  @IsOptional()
  @IsString()
  ingredients?: string;

  @ApiPropertyOptional({ description: 'Skin concerns (comma separated)' })
  @IsOptional()
  @IsString()
  skinConcerns?: string;

  @ApiPropertyOptional({
    description: 'Suitable for skin types (comma separated)',
  })
  @IsOptional()
  @IsString()
  suitableForSkinTypes?: string;

  @ApiPropertyOptional({ description: 'Minimum SKU price' })
  @IsOptional()
  @IsNumberString()
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Maximum SKU price' })
  @IsOptional()
  @IsNumberString()
  maxPrice?: number;
}
