// src/sku/dto/create-sku.dto.ts
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsDateString,
  ValidateNested,
  Min,
  IsInstance,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { SkuDimensionsDto } from './sku-dimension.dto';
import { Types } from 'mongoose';

export class CreateSkuDto {
  @Transform(({ value }: { value: string }) =>
    Types.ObjectId.createFromHexString(value),
  )
  @IsInstance(Types.ObjectId)
  productId: Types.ObjectId;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => SkuDimensionsDto)
  dimensions?: SkuDimensionsDto;

  @IsString()
  @IsOptional()
  internalNotes?: string;
}
