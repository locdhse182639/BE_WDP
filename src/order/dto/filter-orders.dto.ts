import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional } from 'class-validator';

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

export class FilterOrdersDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumberString()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumberString()
  limit?: number;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
