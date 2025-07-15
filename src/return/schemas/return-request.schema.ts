import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReturnRequestDocument = ReturnRequest & Document;

@Schema({ timestamps: true })
export class ReturnRequest {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Sku', required: true })
  skuId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({
    default: 'pending',
    enum: ['pending', 'approved', 'rejected', 'completed'],
  })
  status: string;

  @Prop()
  adminNotes?: string;
}

export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);
