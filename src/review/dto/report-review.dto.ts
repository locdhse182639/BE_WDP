import { IsArray, IsEnum } from 'class-validator';
import { ReviewReportReason } from '../schemas/review.schema';

export class ReportReviewDto {
  @IsArray()
  @IsEnum(ReviewReportReason, { each: true })
  reasons: ReviewReportReason[];
}
