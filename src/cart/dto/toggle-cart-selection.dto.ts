import { IsBoolean, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleCartSelectionDto {
  @ApiProperty()
  @IsString()
  skuId: string;

  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty()
  @IsBoolean()
  selected: boolean;
}
