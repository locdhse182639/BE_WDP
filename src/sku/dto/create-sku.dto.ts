// src/sku/dto/create-sku.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsDateString,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSkuDto {
  @IsMongoId()
  productId: string;

  @IsString()
  @IsNotEmpty()
  variantName: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsNumber()
  @Min(0)
  stock: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  reservedStock?: number;

  @IsString()
  @IsOptional()
  batchCode?: string;

  @IsDateString()
  @IsOptional()
  manufacturedAt?: Date;

  @IsDateString()
  @IsOptional()
  expiredAt?: Date;

  @IsNumber()
  @IsOptional()
  shelfLifeMonths?: number;

  @IsEnum(['cream', 'gel', 'serum', 'foam', 'lotion'])
  formulationType: string;

  @IsBoolean()
  @IsOptional()
  returnable?: boolean;

  @IsNumber()
  @IsOptional()
  returnCount?: number;

  @IsEnum(['active', 'near_expiry', 'returned', 'hidden', 'discontinued'])
  @IsOptional()
  status?: string;

  @IsNumber()
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  image?: string;

  @IsNumber()
  @IsOptional()
  weight?: number;

  @ValidateNested()
  @Type(() => Object)
  @IsOptional()
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };

  @IsString()
  @IsOptional()
  internalNotes?: string;
}
