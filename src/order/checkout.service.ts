import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CartService } from '@/cart/cart.service';
import { AddressService } from '@/address/address.service';
import { Sku, SkuDocument } from '@/sku/schemas/sku.schema';
import { CouponService } from '@/coupon/coupon.service';
import { Model } from 'mongoose';
import Stripe from 'stripe';
import { CheckoutDto } from './dto/checkout.dto';
import { CartItem } from '@/cart/types/cart-item';

@Injectable()
export class CheckoutService {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
  private stripe: Stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  constructor(
    private readonly cartService: CartService,
    private readonly addressService: AddressService,
    @InjectModel(Sku.name) private skuModel: Model<SkuDocument>,
    private readonly couponService: CouponService,
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = (await this.cartService.getCart(userId)) as CartItem[];
    if (!cart || cart.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let couponDiscount = 0;
    if (dto.couponCode) {
      const coupon = (await this.couponService.validateCouponCode(
        userId,
        dto.couponCode,
      )) as { value: number } | null;
      if (!coupon || typeof coupon.value !== 'number') {
        throw new BadRequestException('Invalid or expired coupon code');
      }
      couponDiscount = coupon.value;
    }

    const lineItems: any[] = [];
    for (const item of cart) {
      const sku = await this.skuModel.findById(item.skuId);
      if (!sku) {
        throw new BadRequestException(`SKU not found: ${item.skuId}`);
      }

      if (sku.stock - sku.reservedStock < item.quantity) {
        throw new BadRequestException(
          `Not enough stock for ${sku.variantName}`,
        );
      }

      const price = item.priceSnapshot ?? sku.price;
      const usedReturned = Math.min(item.quantity, sku.returnedStock ?? 0);
      const normalQty = item.quantity - usedReturned;

      // Audit log for returned portion
      if (usedReturned > 0) {
        const returnedPrice = Math.round(
          price * 0.8 * (1 - couponDiscount / 100),
        );
        const stripeReturnedPrice =
          Math.ceil(Math.max(0, returnedPrice) / 1000) * 1000;
        lineItems.push({
          price_data: {
            currency: 'vnd',
            product_data: {
              name: item.skuName + ' (Returned)',
              images: item.image ? [item.image] : [],
            },
            unit_amount: stripeReturnedPrice,
          },
          quantity: usedReturned,
        });
        // Audit log
        console.log(
          `[AUDIT] CartItem Returned: SKU ${item.skuId}, Qty ${usedReturned}, Price ${stripeReturnedPrice}`,
        );
      }

      // Audit log for normal portion
      if (normalQty > 0) {
        const normalPrice = Math.round(price * (1 - couponDiscount / 100));
        const stripeNormalPrice =
          Math.ceil(Math.max(0, normalPrice) / 1000) * 1000;
        lineItems.push({
          price_data: {
            currency: 'vnd',
            product_data: {
              name: item.skuName,
              images: item.image ? [item.image] : [],
            },
            unit_amount: stripeNormalPrice,
          },
          quantity: normalQty,
        });
        // Audit log
        console.log(
          `[AUDIT] CartItem Normal: SKU ${item.skuId}, Qty ${normalQty}, Price ${stripeNormalPrice}`,
        );
      }
    }

    // Create Stripe session
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      metadata: {
        userId,
        addressId: dto.addressId,
        ...(dto.couponCode ? { couponCode: dto.couponCode } : {}),
      },
    });

    // Optionally mark coupon as used after successful payment in webhook/order creation
    return { url: session.url };
  }
}
