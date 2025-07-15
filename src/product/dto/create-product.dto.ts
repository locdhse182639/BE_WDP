import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Skin Relief Moisturizer' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Paula’s Choice' })
  @IsString()
  @IsOptional()
  brand?: string;

  @ApiProperty({ example: 'Hydrates and soothes sensitive skin.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['water', 'niacinamide'] })
  @IsArray()
  @IsOptional()
  ingredients?: string[];

  @ApiProperty({ example: ['sensitive', 'dry'] })
  @IsArray()
  @IsOptional()
  skinConcerns?: string[];

  @ApiProperty({ example: ['normal', 'dry', 'sensitive'] })
  @IsArray()
  @IsOptional()
  suitableForSkinTypes?: string[];

  @ApiProperty({ example: ['true', 'false'] })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  isActive?: boolean;

  @ApiProperty({ example: ['https://cdn.com/img1.jpg'] })
  @IsArray()
  @IsOptional()
  images?: string[];
}
