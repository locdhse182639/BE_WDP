import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreateRefundRequestDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsString()
  @IsNotEmpty()
  reason: string;
}
