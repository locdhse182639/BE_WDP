import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ShippingAddressDto {
  @ApiProperty() @IsString() fullName: string;
  @ApiProperty() @IsString() phone: string;
  @ApiProperty() @IsString() street: string;
  @ApiProperty() @IsString() city: string;
  @ApiProperty() @IsString() country: string;
  @ApiProperty() @IsString() postalCode: string;
}

export class CreateDeliveryDto {
  @ApiProperty() @IsMongoId() orderId: string;
  @ApiProperty() @IsMongoId() customerId: string;

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  deliveryFee?: number;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsMongoId()
  deliveryPersonnelId?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  estimatedDeliveryDate?: string;
  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  requiresSignature?: boolean;
}
