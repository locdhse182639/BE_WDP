import { IsString, IsOptional } from 'class-validator';

export class AdminUpdateRefundDto {
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
