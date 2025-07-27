import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsString, IsOptional, IsArray } from 'class-validator';

export class CreateReturnRequestDto {
  @ApiProperty({ description: 'Order ID for the return request' })
  @IsMongoId()
  orderId: string;

  @ApiProperty({ description: 'Reason for return' })
  @IsString()
  reason: string;

  @ApiProperty({
    description: 'Optional images for proof/condition',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  images?: string[];
}
