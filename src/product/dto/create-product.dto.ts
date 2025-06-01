import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

  @ApiProperty({ example: ['https://cdn.com/img1.jpg'] })
  @IsArray()
  @IsOptional()
  images?: string[];
}
