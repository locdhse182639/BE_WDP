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

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // Customer: Get a single order (only their own)
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  async getOrderById(
    @Param('id') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.getOrderById(orderId, user);
  }

  // Customer: Get their own orders
  @UseGuards(JwtAuthGuard)
  @Get('me/all')
  async getUserOrders(
    @CurrentUser() user: JwtPayload,
    @Query() query: FilterOrdersDto,
  ) {
    return this.orderService.getUserOrders(user.sub, query);
  }

  // Customer/Admin: Cancel order (only if status = Pending)
  @UseGuards(JwtAuthGuard)
  @Put(':id/cancel')
  async cancelOrder(
    @Param('id') orderId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.orderService.cancelOrder(orderId, user);
  }

  // Admin: Get all orders with filters and pagination
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Get('admin')
  async getAllOrders(@Query() query: FilterOrdersDto) {
    return this.orderService.getAllOrdersAdmin(query);
  }

  // Admin: Update order status
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Put(':id/status')
  async updateOrderStatus(
    @Param('id') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.orderService.updateOrderStatus(orderId, dto);
  }

  // Admin: Analytics
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Get('admin/analytics')
  async getAnalytics() {
    return this.orderService.getOrderAnalytics();
  }
}
