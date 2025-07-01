import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class UserCouponIdDto {
  @ApiProperty({ description: 'Coupon ID' })
  @IsMongoId()
  couponId: string;
}
