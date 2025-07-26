import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
  Put,
  Body,
} from '@nestjs/common';
import { OrderService } from './order.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleGuard } from '@/common/guards/role.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrdersDto } from './dto/filter-orders.dto';
import { ApiBearerAuth } from '@nestjs/swagger';
import { ApiQuery } from '@nestjs/swagger';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/all')
  @ApiBearerAuth()
  async getUserOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: FilterOrdersDto,
  ) {
    return this.orderService.getUserOrders(user.sub, query);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Get('admin')
  @ApiBearerAuth()
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    description: 'Filter by order status',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    description: 'Filter by user email (admin only)',
  })
  async getAllOrders(@Query() query: FilterOrdersDto) {
    return this.orderService.getAllOrdersAdmin(query);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Get('admin/analytics')
  @ApiBearerAuth()
  async getAnalytics() {
    return this.orderService.getOrderAnalytics();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  async getOrderById(
    @Param('id') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.getOrderById(orderId, user);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  @ApiBearerAuth()
  async cancelOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.cancelOrder(orderId, user);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Put(':id/status')
  @ApiBearerAuth()
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(orderId, dto);
  }
}
