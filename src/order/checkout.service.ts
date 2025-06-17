import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CartService } from '@/cart/cart.service';
import { AddressService } from '@/address/address.service';
import { Sku, SkuDocument } from '@/sku/schemas/sku.schema';
import { Model, Types } from 'mongoose';
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
  ) {}

  async checkout(userId: string, dto: CheckoutDto) {
    const cart = (await this.cartService.getCart(userId)) as CartItem[];
    if (!cart || cart.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const address = await this.addressService.findById(dto.addressId);
    if (!address || String(address.userId) !== String(userId)) {
      throw new NotFoundException('Address not found');
    }

    const lineItems = await Promise.all(
      cart.map(async (item) => {
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
        const discount = item.discountSnapshot ?? 0;
        const discounted = price * (1 - discount / 100);
        const finalPrice = Math.ceil(Math.max(0, discounted) / 1000) * 1000;

        return {
          price_data: {
            currency: 'vnd',
            product_data: {
              name: item.skuName,
              images: item.image ? [item.image] : [],
            },
            unit_amount: finalPrice,
          },
          quantity: item.quantity,
        };
      }),
    );

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,
      line_items: lineItems,
      metadata: {
        userId,
        addressId: dto.addressId,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    return { url: session.url };
  }
}
