import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderItem, OrderItemSchema } from './order-item.schema';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Address', required: true })
  addressId: Types.ObjectId;

  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ enum: ['Stripe'], default: 'Stripe' })
  paymentMethod: 'Stripe';

  @Prop({ default: false })
  isPaid: boolean;

  @Prop()
  paidAt?: Date;

  @Prop({ default: 'Pending' })
  orderStatus: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';

  @Prop({ default: 'Unpaid' })
  paymentStatus: 'Unpaid' | 'Paid' | 'Failed';

  @Prop({
    type: {
      id: String,
      status: String,
      update_time: String,
      email_address: String,
    },
  })
  paymentResult?: {
    id: string;
    status: string;
    update_time: string;
    email_address: string;
  };

  @Prop({ default: false })
  isRefunded: boolean;

  @Prop()
  refundedAt?: Date;

  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  couponId?: Types.ObjectId;

  @Prop({ required: false })
  paymentIntentId?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
