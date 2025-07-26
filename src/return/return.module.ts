import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReturnController } from './return.controller';
import { ReturnService } from './return.service';
import { RefundService } from '../refund/refund.service';
import {
  RefundRequest,
  RefundRequestSchema,
} from '../refund/schemas/refund-request.schema';
import {
  ReturnRequest,
  ReturnRequestSchema,
} from './schemas/return-request.schema';
import { FirebaseModule } from '@/firebase/firebase.module';
import { OrderModule } from '@/order/order.module';
import { SkuModule } from '@/sku/sku.module';
import { UserModule } from '@/user/user.module';
import { EmailModule } from '@/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RefundRequest.name, schema: RefundRequestSchema },
      { name: ReturnRequest.name, schema: ReturnRequestSchema },
    ]),
    FirebaseModule,
    OrderModule,
    SkuModule,
    UserModule,
    EmailModule,
  ],
  controllers: [ReturnController],
  providers: [ReturnService, RefundService],
  exports: [ReturnService],
})
export class ReturnModule {}
