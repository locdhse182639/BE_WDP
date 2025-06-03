import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum DeliveryStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  ASSIGNED = 'assigned',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
}

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus })
  @IsEnum(DeliveryStatus)
  status: DeliveryStatus;
}
