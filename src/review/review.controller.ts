import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Param,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReportReviewDto } from './dto/report-review.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleGuard } from '@/common/guards/role.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';

@ApiTags('Review')
@ApiBearerAuth()
@Controller('review')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @UseGuards(RoleGuard)
  @Roles('user')
  @Post()
  @ApiOperation({ summary: 'Create a review for a delivered product' })
  @ApiQuery({
    name: 'deliveryId',
    type: 'string',
    required: true,
    description: 'Delivery ID',
  })
  @ApiQuery({
    name: 'orderId',
    type: 'string',
    required: true,
    description: 'Order ID',
  })
  @ApiQuery({
    name: 'productId',
    type: 'string',
    required: true,
    description: 'Product ID',
  })
  @ApiQuery({
    name: 'rating',
    type: 'number',
    required: true,
    description: 'Rating for the product',
  })
  @ApiQuery({
    name: 'comment',
    type: 'string',
    required: false,
    description: 'Review comment',
  })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async createReview(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.createReview(user.sub, dto);
  }

  @Post(':id/report')
  @ApiOperation({ summary: 'Report a review for moderation' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reasons: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['profanity', 'racist', 'spam', 'irrelevant', 'other'],
            example: 'spam',
          },
          description: 'Reasons for reporting (enum values)',
        },
      },
      required: ['reasons'],
    },
  })
  @ApiResponse({ status: 200, description: 'Review reported' })
  async reportReview(
    @Param('id') reviewId: string,
    @Body() dto: ReportReviewDto,
  ) {
    return this.reviewService.reportReview(reviewId, dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get reviews (filter by product, delivery, or user)',
  })
  @ApiQuery({
    name: 'productId',
    required: false,
    description: 'Product ID to filter reviews',
  })
  @ApiQuery({
    name: 'deliveryId',
    required: false,
    description: 'Delivery ID to filter reviews',
  })
  @ApiQuery({
    name: 'userId',
    required: false,
    description: 'User ID to filter reviews',
  })
  @ApiResponse({ status: 200, description: 'List of reviews' })
  async getReviews(@Query() query: any) {
    return this.reviewService.getReviews(query);
  }

  @Get('reported')
  @ApiOperation({ summary: 'Admin: Get all reported reviews' })
  @ApiResponse({ status: 200, description: 'List of reported reviews' })
  @UseGuards(RoleGuard)
  @Roles('admin')
  async getReportedReviews() {
    return this.reviewService.getReportedReviews();
  }

  // User: Edit own review
  @Patch(':id')
  @ApiOperation({ summary: 'Edit your review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        rating: { type: 'number', example: 5 },
        comment: { type: 'string', example: 'Updated review comment.' },
        images: {
          type: 'array',
          items: { type: 'string', example: 'https://...' },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Review updated' })
  @UseGuards(RoleGuard)
  @Roles('user')
  async editReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: JwtPayload,
    @Body()
    dto: Partial<{ rating: number; comment?: string; images?: string[] }>,
  ) {
    return this.reviewService.editReview(reviewId, user.sub, dto);
  }

  // User: Soft delete own review
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete your review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted (soft)' })
  @UseGuards(RoleGuard)
  @Roles('user')
  async softDeleteReview(
    @Param('id') reviewId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.reviewService.softDeleteReview(reviewId, user.sub);
  }

  // Admin: Hard delete review
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin: Hard delete a review' })
  @ApiParam({ name: 'id', description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted (hard)' })
  @UseGuards(RoleGuard)
  @Roles('admin')
  async deleteReview(@Param('id') reviewId: string) {
    return this.reviewService.deleteReview(reviewId);
  }
}
