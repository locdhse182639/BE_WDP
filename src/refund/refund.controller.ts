import {
  Controller,
  Post,
  Body,
  UseGuards,
  Param,
  Patch,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { RefundService } from './refund.service';
import { CreateRefundRequestDto } from './dto/create-refund-request.dto';
import { AdminUpdateRefundDto } from './dto/admin-update-refund.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { OrderService } from '../order/order.service';

@ApiTags('Refund')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('refund')
export class RefundController {
  constructor(
    private readonly refundService: RefundService,
    private readonly orderService: OrderService,
  ) {}

  @Post('request')
  @ApiOperation({
    summary: 'Submit a refund request',
    description:
      'Refunds are processed for paid orders using Stripe. The system will fetch the paymentIntentId from the order, create a refund request, and upon admin approval, initiate the refund via Stripe. Only the original payment method will be refunded. Duplicate or excessive refund requests are prevented by business logic.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          format: 'mongoid',
          example: '683d54bbf9076e4042ec1c2e',
          description: 'Order ID (must be paid via Stripe)',
        },
        amount: {
          type: 'number',
          example: 1999,
          description: 'Refund amount in your currency',
        },
        reason: {
          type: 'string',
          example: 'Product defective',
          description: 'Reason for refund',
        },
      },
      required: ['orderId', 'amount', 'reason'],
      description:
        'Refunds are only allowed for paid orders. The system will automatically fetch the Stripe paymentIntentId and process the refund upon admin approval.',
    },
  })
  @ApiResponse({ status: 201, description: 'Refund request submitted' })
  async createRefundRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateRefundRequestDto,
  ) {
    // Fetch order to get paymentIntentId
    const order = await this.orderService.getOrderById(dto.orderId, user);
    if (!order.paymentIntentId) {
      throw new BadRequestException('Order does not have a paymentIntentId');
    }
    return this.refundService.createRefundRequest(
      dto.orderId,
      user.sub,
      dto.amount,
      dto.reason,
      order.paymentIntentId,
    );
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Admin: Approve a refund request' })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: AdminUpdateRefundDto })
  @ApiResponse({ status: 200, description: 'Refund request approved' })
  async approveRefund(
    @Param('id') id: string,
    @Body() dto: AdminUpdateRefundDto,
  ) {
    return this.refundService.approveRefund(id, dto.adminNotes);
  }

  @Patch('reject/:id')
  @ApiOperation({ summary: 'Admin: Reject a refund request' })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: AdminUpdateRefundDto })
  @ApiResponse({ status: 200, description: 'Refund request rejected' })
  async rejectRefund(
    @Param('id') id: string,
    @Body() dto: AdminUpdateRefundDto,
  ) {
    return this.refundService.rejectRefund(id, dto.adminNotes);
  }

  @Patch('complete/:id')
  @ApiOperation({ summary: 'Admin: Complete a refund request' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Refund request completed' })
  async completeRefund(@Param('id') id: string) {
    return this.refundService.completeRefund(id);
  }

  @Get('user')
  @ApiOperation({ summary: 'Get refund requests for current user' })
  @ApiResponse({ status: 200, description: 'List of refund requests' })
  async getRefundRequestsByUser(@CurrentUser() user: JwtPayload) {
    return this.refundService.getRefundRequestsByUser(user.sub);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get refund request by ID' })
  @ApiParam({ name: 'id', required: true })
  @ApiResponse({ status: 200, description: 'Refund request details' })
  async getRefundRequestById(@Param('id') id: string) {
    return this.refundService.getRefundRequestById(id);
  }
}
