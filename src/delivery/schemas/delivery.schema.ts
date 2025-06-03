import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type DeliveryDocument = Delivery & Document;

@Schema({ timestamps: true })
export class Delivery {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  customerId: Types.ObjectId;

  @Prop({
    type: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      country: String,
      postalCode: String,
    },
    required: true,
  })
  shippingAddress: Record<string, string>;

  @Prop({ default: 0 })
  deliveryFee?: number;

  @Prop({
    enum: [
      'pending',
      'processing',
      'assigned',
      'out_for_delivery',
      'delivered',
      'cancelled',
      'failed',
    ],
    default: 'pending',
  })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deliveryPersonnelId?: Types.ObjectId;

  @Prop()
  trackingNumber?: string;

  @Prop()
  estimatedDeliveryDate?: Date;

  @Prop()
  deliveryDate?: Date;

  @Prop()
  deliveryNotes?: string;

  @Prop()
  proofOfDeliveryUrl?: string;

  @Prop({ default: false })
  requiresSignature: boolean;
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);
