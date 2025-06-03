import {
  IsBoolean,
  IsDate,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CartItemDto {
  @ApiProperty()
  @IsMongoId()
  skuId: string;

  @ApiProperty()
  @IsMongoId()
  productId: string;

  @ApiProperty()
  @IsString()
  skuName: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  selected?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  addedAt?: Date;

  @ApiProperty()
  @IsNumber()
  priceSnapshot: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  discountSnapshot?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  stockSnapshot?: number;
}
