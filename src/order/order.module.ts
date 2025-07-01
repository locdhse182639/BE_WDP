import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './schemas/order.schema';
import { Sku, SkuSchema } from '@/sku/schemas/sku.schema';
import { Coupon, CouponSchema } from '@/coupon/schemas/coupon.schema';
import { OrderController } from './order.controller';
import { CheckoutController } from './checkout.controller';
import { OrderWebhookController } from './webhook/order-webhook.controller';
import { OrderService } from './order.service';
import { CheckoutService } from './checkout.service';
import { StripeWebhookService } from './webhook/stripe-webhook.service';
import { CartModule } from '@/cart/cart.module';
import { AddressModule } from '@/address/address.module';
import { UserModule } from '@/user/user.module';
import { CouponModule } from '@/coupon/coupon.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Sku.name, schema: SkuSchema },
      { name: Coupon.name, schema: CouponSchema },
    ]),
    forwardRef(() => CartModule),
    forwardRef(() => AddressModule),
    forwardRef(() => UserModule),
    forwardRef(() => CouponModule),
  ],
  controllers: [OrderController, CheckoutController, OrderWebhookController],
  providers: [OrderService, CheckoutService, StripeWebhookService],
  exports: [OrderService], // Needed for webhook use
})
export class OrderModule {}
