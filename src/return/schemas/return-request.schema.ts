import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReturnRequestDocument = ReturnRequest & Document;

export enum ReturnRejectReason {
  NOT_ELIGIBLE = 'not_eligible',
  OUTSIDE_WINDOW = 'outside_window',
  INSUFFICIENT_EVIDENCE = 'insufficient_evidence',
  FRAUD_SUSPECTED = 'fraud_suspected',
  OTHER = 'other',
}

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

  @Prop({ enum: ReturnRejectReason })
  adminRejectReason?: ReturnRejectReason;

  @Prop({ required: true, default: 1 })
  quantity: number;
}

export const ReturnRequestSchema = SchemaFactory.createForClass(ReturnRequest);

// Mongoose post-save hook to automate returnedStock increment in SKU when a return is approved
ReturnRequestSchema.post('save', async function (doc) {
  // Only act if status is 'approved' and was just set
  if (doc.status === 'approved' && doc.isModified && doc.isModified('status')) {
    try {
      // Access the Sku model from the same mongoose connection
      const SkuModel = doc.$model('Sku');
      await SkuModel.findByIdAndUpdate(
        doc.skuId,
        { $inc: { returnedStock: doc.quantity ?? 1 } },
        { new: true },
      );
    } catch {
      // Optionally log error
    }
  }
});
