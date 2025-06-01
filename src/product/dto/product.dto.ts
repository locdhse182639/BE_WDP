import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() brand?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [String] }) @IsArray() ingredients: string[];
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  skinConcerns?: string[];
  @ApiProperty({ type: [String], required: false })
  @IsOptional()
  @IsArray()
  suitableForSkinTypes?: string[];
}
