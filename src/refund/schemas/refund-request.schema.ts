import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'completed';

@Schema({ timestamps: true })
export class RefundRequest extends Document {
  @Prop({ required: true })
  orderId: string;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: 'pending' })
  status: RefundStatus;

  @Prop()
  adminNotes?: string;

  @Prop({ required: true })
  paymentIntentId: string;
}

export const RefundRequestSchema = SchemaFactory.createForClass(RefundRequest);
