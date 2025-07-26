import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Delivery, DeliverySchema } from './schemas/delivery.schema';
import { DeliveryService } from './delivery.service';
import { DeliveryController } from './delivery.controller';
import { UserModule } from '@/user/user.module';
import { OrderModule } from '@/order/order.module';
import { FirebaseModule } from '@/firebase/firebase.module';
import { SkuModule } from '@/sku/sku.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Delivery.name, schema: DeliverySchema },
    ]),
    forwardRef(() => UserModule),
    forwardRef(() => OrderModule),
    FirebaseModule,
    SkuModule,
  ],
  providers: [DeliveryService],
  controllers: [DeliveryController],
  exports: [DeliveryService],
})
export class DeliveryModule {}
