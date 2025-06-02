import { IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SkuDimensionsDto {
  @ApiProperty()
  @IsNumber()
  length: number;

  @ApiProperty()
  @IsNumber()
  width: number;

  @ApiProperty()
  @IsNumber()
  height: number;
}
