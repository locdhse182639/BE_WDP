/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { AddressService } from '@/address/address.service';
import { CartService } from '@/cart/cart.service';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { OrderService } from '../order.service';

@Injectable()
export class StripeWebhookService {
  private stripe: Stripe;
  private readonly logger = new Logger('StripeWebhook');

  constructor(
    config: ConfigService,
    private readonly cartService: CartService,
    private readonly orderService: OrderService,
    private readonly addressService: AddressService,
  ) {
    const apiKey = config.get<string>('STRIPE_SECRET_KEY');
    if (!apiKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined');
    }
    this.stripe = new Stripe(apiKey);
  }

  async handleStripeEvent(payload: Buffer | string, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        endpointSecret,
      );
    } catch (err) {
      this.logger.error('Error constructing Stripe event', err);
      console.log('Error constructing Stripe event', err);
      throw new Error('Invalid Stripe signature');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      const userId = session.metadata?.userId;
      const addressId = session.metadata?.addressId;

      if (!userId || !addressId) {
        throw new Error('Missing userId or addressId in session metadata');
      }

      this.logger.log(
        `Processing checkout session completed for user ${userId} and address ${addressId}`,
      );
      console.log(
        `Processing checkout session completed for user ${userId} and address ${addressId}`,
      );

      await this.orderService.createOrderFromSession(userId, addressId);
      await this.cartService.clearCart(userId);
    }
  }
}
