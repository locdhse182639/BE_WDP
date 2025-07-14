import {
  IsMongoId,
  IsInt,
  Min,
  Max,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator';

export class CreateReviewDto {
  @IsMongoId()
  deliveryId: string;

  @IsMongoId()
  orderId: string;

  @IsMongoId()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  images?: string[];
}
