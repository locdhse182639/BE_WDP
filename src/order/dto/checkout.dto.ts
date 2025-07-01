import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ description: 'User address ID for delivery' })
  @IsNotEmpty()
  @IsString()
  addressId: string;

  @ApiProperty({
    description: 'Coupon code to apply (optional)',
    required: false,
  })
  @IsString()
  couponCode?: string;
}
