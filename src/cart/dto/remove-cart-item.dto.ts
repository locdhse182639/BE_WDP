import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveCartItemDto {
  @ApiProperty()
  @IsString()
  skuId: string;

  @ApiProperty()
  @IsString()
  productId: string;
}
