import { IsInt, IsPositive, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartQuantityDto {
  @ApiProperty()
  @IsString()
  skuId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsInt()
  @IsPositive()
  quantity: number;
}
