/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReportReviewDto } from './dto/report-review.dto';
import { Delivery } from '@/delivery/schemas/delivery.schema';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Delivery.name) private readonly deliveryModel: Model<any>,
  ) {}

  async createReview(userId: string, dto: CreateReviewDto): Promise<Review> {
    const delivery = await this.deliveryModel.findById(dto.deliveryId);
    if (!delivery) throw new BadRequestException('Delivery not found');
    if (delivery.status !== 'delivered')
      throw new ForbiddenException('Delivery not completed');
    if (String(delivery.customerId) !== String(userId))
      throw new ForbiddenException('Not your delivery');
    const exists = await this.reviewModel.findOne({
      deliveryId: dto.deliveryId,
      productId: dto.productId,
      userId: userId,
    });
    if (exists)
      throw new BadRequestException(
        'You already reviewed this product for this delivery',
      );
    const review = new this.reviewModel({
      ...dto,
      userId: new Types.ObjectId(userId),
    });
    await review.save();
    return review;
  }

  async reportReview(reviewId: string, dto: ReportReviewDto): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    review.reported = true;
    review.reportReasons = Array.from(
      new Set([...(review.reportReasons || []), ...dto.reasons]),
    );
    await review.save();
    return review;
  }

  async getReviews(filter: any = {}): Promise<Review[]> {
    return this.reviewModel
      .find({ ...filter, deleted: false })
      .populate({ path: 'userId', select: 'email' })
      .sort({ createdAt: -1 });
  }
  async editReview(
    reviewId: string,
    userId: string,
    dto: Partial<{ rating: number; comment?: string; images?: string[] }>,
  ): Promise<Review> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.deleted) throw new BadRequestException('Review is deleted');
    if (review.reported)
      throw new BadRequestException('Cannot edit a reported review');
    if (String(review.userId) !== String(userId))
      throw new ForbiddenException('Not your review');
    if (dto.rating !== undefined) review.rating = dto.rating;
    if (dto.comment !== undefined) review.comment = dto.comment;
    if (dto.images !== undefined) review.images = dto.images;
    await review.save();
    return review;
  }

  async softDeleteReview(
    reviewId: string,
    userId: string,
  ): Promise<{ message: string }> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    if (review.deleted) throw new BadRequestException('Review already deleted');
    if (String(review.userId) !== String(userId))
      throw new ForbiddenException('Not your review');
    review.deleted = true;
    await review.save();
    return { message: 'Review deleted (soft)' };
  }

  async getReportedReviews(): Promise<Review[]> {
    return this.reviewModel.find({ reported: true }).sort({ createdAt: -1 });
  }

  async deleteReview(reviewId: string): Promise<{ message: string }> {
    const review = await this.reviewModel.findById(reviewId);
    if (!review) throw new NotFoundException('Review not found');
    await review.deleteOne();
    return { message: 'Review deleted' };
  }
}
