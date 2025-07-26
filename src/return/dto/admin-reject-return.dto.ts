import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ReturnRejectReason {
  NOT_ELIGIBLE = 'not_eligible',
  OUTSIDE_WINDOW = 'outside_window',
  INSUFFICIENT_EVIDENCE = 'insufficient_evidence',
  FRAUD_SUSPECTED = 'fraud_suspected',
  OTHER = 'other',
}

export class AdminRejectReturnDto {
  @IsEnum(ReturnRejectReason)
  reason: ReturnRejectReason;

  @IsString()
  @IsOptional()
  adminNotes?: string;
}
