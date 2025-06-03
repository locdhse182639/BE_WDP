import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';

@Schema({ _id: false })
export class OrderItem {
  @Prop({ type: Types.ObjectId, required: true })
  skuId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  skuName: string;

  @Prop()
  image?: string;

  @Prop({ required: true })
  quantity: number;

  @Prop({ required: true })
  priceSnapshot: number;

  @Prop()
  discountSnapshot?: number;

  @Prop()
  stockSnapshot?: number;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);
