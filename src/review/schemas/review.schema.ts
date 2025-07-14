import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ReviewReportReason {
  PROFANITY = 'profanity',
  RACIST = 'racist',
  SPAM = 'spam',
  IRRELEVANT = 'irrelevant',
  OTHER = 'other',
}

export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Delivery', required: true })
  deliveryId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  comment?: string;

  @Prop({ type: [String], default: [] })
  images?: string[];

  @Prop({ default: false })
  reported: boolean;

  @Prop({ type: [String], enum: ReviewReportReason, default: [] })
  reportReasons?: ReviewReportReason[];

  @Prop({ default: false })
  deleted: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
