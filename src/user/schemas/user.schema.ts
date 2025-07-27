import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: 'user', enum: ['user', 'admin', 'delivery'] })
  role: string;

  @Prop()
  name?: string;

  @Prop()
  phone?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop()
  emailVerifiedAt?: Date;

  @Prop()
  emailVerificationToken?: string;

  @Prop()
  lastLogin?: Date;

  @Prop({ default: false })
  isBanned: boolean;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({
    type: String,
    enum: ['normal', 'dry', 'oily', 'combination', 'sensitive'],
  })
  skinType?: string;

  @Prop({ type: Types.ObjectId, ref: 'Address' })
  defaultShippingAddressId?: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: 'Product', default: [] })
  wishlist: Types.ObjectId[];

  @Prop({ type: [Types.ObjectId], ref: 'Coupon', default: [] })
  coupons: Types.ObjectId[];

  @Prop({ default: 0 })
  points: number;

  @Prop()
  referralCode?: string;

  @Prop({ type: [String], default: [] })
  deviceTokens: string[];

  @Prop()
  passwordResetOtp?: string;

  @Prop()
  passwordResetExpires?: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
