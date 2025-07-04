/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '@/user/schemas/user.schema';
import { Coupon, CouponDocument } from './schemas/coupon.schema';
import { AdminUpdateCouponDto } from './dto/admin-update-coupon.dto';
import { AdminSearchCouponDto } from './dto/admin-search-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectModel(Coupon.name)
    private readonly couponModel: Model<CouponDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  // Award points to user based on order amount (VND)
  async awardPoints(userId: string, orderAmount: number): Promise<number> {
    // Example: 1 point per 100,000 VND spent
    const points = Math.floor(orderAmount / 100000);
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    user.points = (user.points || 0) + points;
    await user.save();
    return user.points;
  }

  // Exchange points for a percent coupon (e.g., 10 points = 10% coupon)
  async exchangePointsForCoupon(
    userId: string,
    pointsToExchange: number,
  ): Promise<CouponDocument> {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');
    if ((user.points || 0) < pointsToExchange)
      throw new BadRequestException('Not enough points');
    if (pointsToExchange < 1 || pointsToExchange > 100)
      throw new BadRequestException('Coupon percent must be between 1 and 100');
    user.points -= pointsToExchange;
    await user.save();
    // Generate a unique coupon code
    const code =
      'CP' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const couponDoc = await this.couponModel.create({
      userId: user._id,
      code,
      value: pointsToExchange,
      isUsed: false,
    });
    // Optionally add coupon to user's coupons array
    if (Array.isArray(user.coupons)) {
      user.coupons.push(couponDoc._id as Types.ObjectId);
      await user.save();
    }
    return couponDoc as CouponDocument;
  }
  // Validate a coupon code for a user (not used, not expired, belongs to user)
  async validateCouponCode(
    userId: string,
    code: string,
  ): Promise<CouponDocument> {
    console.log('[validateCouponCode] userId:', userId, 'code:', code);
    const coupon = await this.couponModel.findOne({
      code,
      userId: new Types.ObjectId(userId),
      isUsed: false,
    });
    console.log('[validateCouponCode] coupon found:', coupon);
    if (!coupon)
      throw new NotFoundException('Coupon not found or already used');
    // Optionally check for expiration here
    return coupon;
  }

  // Apply coupon at checkout
  async applyCoupon(
    userId: string,
    couponId: string,
    totalAmount: number,
  ): Promise<{ discountedTotal: number; discount: number }> {
    const coupon = (await this.couponModel.findOne({
      _id: couponId,
      userId,
      isUsed: false,
    })) as CouponDocument | null;
    if (!coupon)
      throw new NotFoundException('Coupon not found or already used');
    const discount = Math.min(coupon.value, totalAmount);
    coupon.isUsed = true;
    coupon.usedAt = new Date();
    await coupon.save();
    return { discountedTotal: totalAmount - discount, discount };
  }

  // Get user points and all coupons
  async getUserCoupons(
    userId: string,
  ): Promise<{ points: number; coupons: Coupon[] }> {
    console.log('[getUserCoupons] userId:', userId);
    const user = await this.userModel.findById(userId);
    if (!user) {
      console.warn('[getUserCoupons] User not found for userId:', userId);
      throw new NotFoundException('User not found');
    }
    console.log(
      '[getUserCoupons] Found user:',
      user.email,
      'points:',
      user.points,
    );
    let coupons = [];
    if (Array.isArray(user.coupons) && user.coupons.length > 0) {
      coupons = await this.couponModel.find({ _id: { $in: user.coupons } });
    }
    console.log('[getUserCoupons] Found coupons:', coupons.length);
    return { points: user.points || 0, coupons };
  }
  // --- ADMIN METHODS ---
  async adminListCoupons(
    query: AdminSearchCouponDto,
  ): Promise<{ data: Coupon[]; total: number }> {
    const filter: Record<string, any> = {};
    if (query.code) filter.code = { $regex: query.code, $options: 'i' };
    if (typeof query.isUsed === 'boolean') filter.isUsed = query.isUsed;
    let userId: string | undefined;
    if (query.email) {
      const user = await this.userModel.findOne({
        email: { $regex: query.email, $options: 'i' },
      });
      if (!user) return { data: [], total: 0 };
      userId = String(user._id);
      filter.userId = userId;
    }
    const coupons = await this.couponModel.find(filter).sort({ createdAt: -1 });
    return { data: coupons, total: coupons.length };
  }

  async adminUpdateCoupon(
    id: string,
    dto: AdminUpdateCouponDto,
  ): Promise<CouponDocument> {
    const coupon = (await this.couponModel.findById(
      id,
    )) as CouponDocument | null;
    if (!coupon) throw new NotFoundException('Coupon not found');
    if (dto.code !== undefined) coupon.code = dto.code;
    if (dto.value !== undefined) coupon.value = dto.value;
    if (dto.isUsed !== undefined) coupon.isUsed = dto.isUsed;
    if (dto.expiresAt !== undefined) {
      coupon.expiresAt = new Date(dto.expiresAt);
    }
    if (dto.description !== undefined) coupon.description = dto.description;
    await coupon.save();
    return coupon;
  }

  async adminDeleteCoupon(id: string): Promise<{ message: string }> {
    const coupon = (await this.couponModel.findById(
      id,
    )) as CouponDocument | null;
    if (!coupon) throw new NotFoundException('Coupon not found');
    await coupon.deleteOne();
    return { message: 'Coupon deleted' };
  }

  // --- USER METHODS ---
  async getUserCouponById(
    userId: string,
    couponId: string,
  ): Promise<CouponDocument> {
    const coupon = (await this.couponModel.findOne({
      _id: couponId,
      userId,
    })) as CouponDocument | null;
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async deleteUserCoupon(
    userId: string,
    couponId: string,
  ): Promise<{ message: string }> {
    const coupon = (await this.couponModel.findOne({
      _id: couponId,
      userId,
    })) as CouponDocument | null;
    if (!coupon) throw new NotFoundException('Coupon not found');
    await coupon.deleteOne();
    return { message: 'Coupon deleted' };
  }
}
