import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CartService } from '@/cart/cart.service';
import { AddressService } from '@/address/address.service';
import { CartItem } from '@/cart/types/cart-item';
import { Sku, SkuDocument } from '@/sku/schemas/sku.schema';
import { Order, OrderDocument } from './schemas/order.schema';
import { OrderItem } from './schemas/order-item.schema'; // adjust path if needed
import { JwtPayload } from '@/auth/types/jwt-payload';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { FilterOrdersDto, OrderStatus } from './dto/filter-orders.dto';
import { UserService } from '@/user/user.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly cartService: CartService,
    private readonly addressService: AddressService,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Sku.name) private readonly skuModel: Model<SkuDocument>,
    private readonly userService: UserService,
    @InjectModel('Coupon') private readonly couponModel: Model<any>,
  ) {}

  async createOrderFromSession(
    userId: string,
    addressId: string,
    couponCode?: string,
    paymentIntentId?: string,
    amountTotal?: number,
  ): Promise<OrderDocument> {
    const cart = (await this.cartService.getCart(userId)) as CartItem[];
    if (!cart || cart.length === 0) {
      throw new BadRequestException('Cart is empty during checkout');
    }

    const address = await this.addressService.findById(addressId);
    if (!address || String(address.userId) !== String(userId)) {
      throw new NotFoundException('Invalid shipping address');
    }

    const orderItems: OrderItem[] = [];
    let subtotal = 0;

    for (const item of cart) {
      const sku = (await this.skuModel.findById(item.skuId)) as SkuDocument;
      if (!sku) {
        throw new BadRequestException(`SKU not found: ${item.skuId}`);
      }

      if (sku.stock - sku.reservedStock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for ${sku.variantName}`,
        );
      }

      sku.reservedStock += item.quantity;
      await sku.save();

      const price = item.priceSnapshot ?? sku.price;
      const discount = item.discountSnapshot ?? 0;
      const usedReturned = Math.min(item.quantity, sku.returnedStock ?? 0);
      const normalQty = item.quantity - usedReturned;

      // Returned portion
      if (usedReturned > 0) {
        const returnedFinalPrice = Math.round(
          price * 0.8 * (1 - discount / 100),
        );
        subtotal += returnedFinalPrice * usedReturned;
        orderItems.push({
          skuId: sku._id as Types.ObjectId,
          productId: new Types.ObjectId(item.productId),
          quantity: usedReturned,
          priceSnapshot: price,
          discountSnapshot: 100 - Math.round(80 * (1 - discount / 100)),
          stockSnapshot: sku.stock,
          image: item.image ?? sku.images?.[0],
          skuName: (item.skuName ?? sku.variantName) + ' (Returned)',
        });
        // Audit log
        console.log(
          `[AUDIT] OrderItem Returned: SKU ${item.skuId}, Qty ${usedReturned}, Price ${returnedFinalPrice}`,
        );
      }

      // Normal portion
      if (normalQty > 0) {
        const normalFinalPrice = Math.round(price * (1 - discount / 100));
        subtotal += normalFinalPrice * normalQty;
        orderItems.push({
          skuId: sku._id as Types.ObjectId,
          productId: new Types.ObjectId(item.productId),
          quantity: normalQty,
          priceSnapshot: price,
          discountSnapshot: discount,
          stockSnapshot: sku.stock,
          image: item.image ?? sku.images?.[0],
          skuName: item.skuName ?? sku.variantName,
        });
        // Audit log
        console.log(
          `[AUDIT] OrderItem Normal: SKU ${item.skuId}, Qty ${normalQty}, Price ${normalFinalPrice}`,
        );
      }

      // Handle returnedStock and isReturned
      if (usedReturned > 0) {
        sku.returnedStock -= usedReturned;
        if (sku.returnedStock <= 0) {
          sku.isReturned = false;
          sku.returnedStock = 0;
        }
      }
      if (normalQty > 0) {
        sku.stock -= normalQty;
      }
      // Always decrement reservedStock after order is finalized
      sku.reservedStock -= item.quantity;
      if (sku.reservedStock < 0) sku.reservedStock = 0;
      await sku.save();
    }

    let couponId: Types.ObjectId | undefined = undefined;
    if (couponCode) {
      // Find and mark coupon as used
      const coupon:
        | import('@/coupon/schemas/coupon.schema').CouponDocument
        | null = await this.couponModel.findOne({
        code: couponCode,
        userId,
        isUsed: false,
      });
      if (coupon) {
        coupon.isUsed = true;
        coupon.usedAt = new Date();
        await coupon.save();
        couponId = coupon._id as import('mongoose').Types.ObjectId;
      }
    }

    const newOrder = new this.orderModel({
      userId: new Types.ObjectId(userId),
      addressId: new Types.ObjectId(addressId),
      items: orderItems,
      subtotal,
      totalAmount: amountTotal ?? subtotal,
      paymentMethod: 'Stripe',
      paymentStatus: 'Paid',
      isPaid: true,
      paidAt: new Date(),
      ...(couponId ? { couponId } : {}),
      ...(paymentIntentId ? { paymentIntentId } : {}),
    });

    return newOrder.save();
  }

  async getOrderById(orderId: string, user: JwtPayload) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (order.userId.toString() !== user.sub && user.role !== 'admin') {
      throw new ForbiddenException('Not authorized to view this order');
    }

    return order;
  }

  async getUserOrders(userId: string, query: FilterOrdersDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const filter: Partial<Pick<Order, 'userId' | 'orderStatus'>> = {
      userId: new Types.ObjectId(userId),
    };
    if (query.status) filter.orderStatus = query.status;

    const [orders, totalItems] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data: orders,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async cancelOrder(orderId: string, user: JwtPayload) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if (order.userId.toString() !== user.sub && user.role !== 'admin') {
      throw new ForbiddenException('You cannot cancel this order');
    }

    if (order.orderStatus !== 'Pending') {
      throw new BadRequestException('Only pending orders can be cancelled');
    }

    order.orderStatus = 'Cancelled';
    order.paymentStatus = 'Failed';
    order.isPaid = false;
    return order.save();
  }

  async getAllOrdersAdmin(query: FilterOrdersDto) {
    const page = Number(query.page ?? 1);
    const limit = Number(query.limit ?? 10);
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (query.status) filter.orderStatus = query.status;

    // If email is provided, find user and filter by userId
    if (query.email) {
      const user = await this.userService.findByEmail(query.email);
      if (!user) {
        return {
          data: [],
          meta: {
            totalItems: 0,
            totalPages: 0,
            currentPage: page,
            limit,
          },
        };
      }
      filter.userId = user._id;
    }

    const [orders, totalItems] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      this.orderModel.countDocuments(filter),
    ]);

    return {
      data: orders,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async updateOrderStatus(orderId: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    const validStatuses = [
      'Pending',
      'Processing',
      'Shipped',
      'Delivered',
      'Cancelled',
    ];

    if (!validStatuses.includes(dto.orderStatus)) {
      throw new BadRequestException('Invalid order status');
    }

    if (
      dto.orderStatus === OrderStatus.DELIVERED &&
      order.orderStatus !== OrderStatus.SHIPPED
    ) {
      throw new BadRequestException('Order must be shipped before delivered');
    }

    if (
      dto.orderStatus === OrderStatus.CANCELLED &&
      order.orderStatus === OrderStatus.SHIPPED
    ) {
      throw new BadRequestException('Cannot cancel a shipped order');
    }

    order.orderStatus = dto.orderStatus;
    return order.save();
  }

  async getOrderAnalytics() {
    const totalOrders = await this.orderModel.countDocuments();

    interface RevenueAggregation {
      _id: null;
      total: number;
    }

    const totalRevenueAgg = await this.orderModel.aggregate<RevenueAggregation>(
      [
        { $match: { isPaid: true } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ],
    );

    const totalRevenue = totalRevenueAgg[0]?.total ?? 0;

    const statusCounts = await this.orderModel.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]);

    const monthlySales = await this.orderModel.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return {
      totalOrders,
      totalRevenue,
      orderByStatus: statusCounts,
      monthlySales,
    };
  }

  async findById(orderId: string): Promise<OrderDocument | null> {
    return this.orderModel.findById(orderId);
  }
}
