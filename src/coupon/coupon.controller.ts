/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { AdminUpdateCouponDto } from './dto/admin-update-coupon.dto';
import { AdminSearchCouponDto } from './dto/admin-search-coupon.dto';
import { Coupon } from './schemas/coupon.schema';
// import { UserCouponIdDto } from './dto/user-coupon-id.dto';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleGuard } from '@/common/guards/role.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';

@ApiTags('Coupon')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  // --- ADMIN ENDPOINTS ---
  @UseGuards(RoleGuard)
  @Roles('admin')
  @Get('admin/all')
  @ApiOperation({ summary: 'Admin: List/search all coupons' })
  @ApiResponse({ status: 200, description: 'List of all coupons' })
  async adminListCoupons(
    @Query() query: AdminSearchCouponDto,
  ): Promise<{ data: Coupon[]; total: number }> {
    return this.couponService.adminListCoupons(query);
  }

  @UseGuards(RoleGuard)
  @Roles('admin')
  @Put('admin/:id')
  @ApiOperation({ summary: 'Admin: Update coupon' })
  @ApiResponse({ status: 200, description: 'Coupon updated' })
  async adminUpdateCoupon(
    @Param('id') id: string,
    @Body() dto: AdminUpdateCouponDto,
  ): Promise<import('./schemas/coupon.schema').CouponDocument> {
    return this.couponService.adminUpdateCoupon(id, dto);
  }

  @UseGuards(RoleGuard)
  @Roles('admin')
  @Delete('admin/:id')
  @ApiOperation({ summary: 'Admin: Delete coupon' })
  @ApiResponse({ status: 200, description: 'Coupon deleted' })
  async adminDeleteCoupon(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.couponService.adminDeleteCoupon(id);
  }

  // --- USER ENDPOINTS ---
  @Get('my-coupons')
  @ApiOperation({ summary: 'Get all my coupons' })
  @ApiResponse({ status: 200, description: 'User coupons' })
  async getMyCoupons(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ points: number; coupons: Coupon[] }> {
    return this.couponService.getUserCoupons(user.sub);
  }

  @Get('my-coupons/:id')
  @ApiOperation({ summary: 'Get my coupon by ID' })
  @ApiResponse({ status: 200, description: 'User coupon detail' })
  async getMyCouponById(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<import('./schemas/coupon.schema').CouponDocument> {
    return this.couponService.getUserCouponById(user.sub, id);
  }

  @Delete('my-coupons/:id')
  @ApiOperation({ summary: 'Delete my coupon by ID' })
  @ApiResponse({ status: 200, description: 'User coupon deleted' })
  async deleteMyCoupon(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return this.couponService.deleteUserCoupon(user.sub, id);
  }

  @Get('my-points')
  @ApiOperation({ summary: 'Get current user points and coupons' })
  @ApiResponse({ status: 200, description: 'User points and coupons' })
  async getMyPoints(
    @CurrentUser() user: JwtPayload,
  ): Promise<{ points: number; coupons: Coupon[] }> {
    // Assume userService returns points and coupons
    return this.couponService.getUserCoupons(user.sub);
  }

  @Post('exchange/:points')
  @ApiOperation({ summary: 'Exchange points for a coupon' })
  @ApiResponse({ status: 201, description: 'Coupon created' })
  async exchangePoints(
    @CurrentUser() user: JwtPayload,
    @Param('points') points: string,
  ): Promise<import('./schemas/coupon.schema').CouponDocument> {
    // Example: 10 points for a 10% coupon
    // You may want to add more logic or DTOs
    return this.couponService.exchangePointsForCoupon(user.sub, Number(points));
  }

  @Post('validate/:code')
  @ApiOperation({ summary: 'Validate a coupon code for checkout' })
  @ApiResponse({ status: 200, description: 'Coupon is valid' })
  async validateCoupon(
    @CurrentUser() user: JwtPayload,
    @Param('code') code: string,
  ): Promise<import('./schemas/coupon.schema').CouponDocument> {
    return this.couponService.validateCouponCode(user.sub, code);
  }
}
