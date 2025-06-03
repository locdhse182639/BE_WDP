import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignDeliveryPersonnelDto {
  @ApiProperty()
  @IsString()
  deliveryPersonnelId: string;
}
