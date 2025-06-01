import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SkuDocument = Sku & Document;

@Schema({ timestamps: true })
export class Sku {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  variantName: string;

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  stock: number;

  @Prop({ default: 0 })
  reservedStock: number;

  @Prop()
  batchCode?: string;

  @Prop()
  manufacturedAt?: Date;

  @Prop()
  expiredAt?: Date;

  @Prop()
  shelfLifeMonths?: number;

  @Prop({ enum: ['cream', 'gel', 'serum', 'foam', 'lotion'], required: true })
  formulationType: string;

  @Prop({ default: true })
  returnable: boolean;

  @Prop({ default: 0 })
  returnCount: number;

  @Prop({
    default: 'active',
    enum: ['active', 'near_expiry', 'returned', 'hidden', 'discontinued'],
  })
  status: string;

  @Prop({ default: 0 })
  discount: number;

  @Prop()
  image?: string;

  @Prop()
  weight?: number; // in grams

  @Prop({ type: Object })
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };

  @Prop()
  internalNotes?: string;
}

export const SkuSchema = SchemaFactory.createForClass(Sku);
