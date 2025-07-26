/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RefundRequest } from './schemas/refund-request.schema';

@Injectable()
export class RefundService {
  private stripe: Stripe;

  constructor(
    @InjectModel(RefundRequest.name) private refundModel: Model<RefundRequest>,
  ) {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey)
      throw new InternalServerErrorException('Stripe secret key not set');
    this.stripe = new Stripe(stripeKey);
  }

  // Simple audit log function
  private logRefundAudit({
    action,
    refundId,
    orderId,
    userId,
    amount,
    reason,
  }) {
    console.log(
      `[AUDIT] REFUND ${action}: refundId=${refundId} orderId=${orderId} userId=${userId} amount=${amount} reason=${String(reason)}`,
    );
  }

  async createRefundRequest(
    orderId: string,
    userId: string,
    amount: number,
    reason: string,
    paymentIntentId: string,
  ) {
    const refund = new this.refundModel({
      orderId,
      userId,
      amount,
      reason,
      status: 'pending',
      paymentIntentId,
    });
    await refund.save();
    this.logRefundAudit({
      action: 'created',
      refundId: refund._id,
      orderId,
      userId,
      amount,
      reason,
    });
    // Automatically process Stripe refund after creation
    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount,
        reason: 'requested_by_customer',
      });
      refund.status = 'approved';
      await refund.save();
      this.logRefundAudit({
        action: 'stripe_approved',
        refundId: refund._id,
        orderId,
        userId,
        amount,
        reason,
      });
      return { refund, stripeRefund };
    } catch (err: any) {
      this.logRefundAudit({
        action: 'stripe_failed',
        refundId: refund._id,
        orderId,
        userId,
        amount,
        reason: String(err?.message ?? err),
      });
      throw new InternalServerErrorException(
        'Stripe refund failed: ' + (err.message || err),
      );
    }
  }

  async approveRefund(id: string, adminNotes?: string) {
    const refund = await this.refundModel.findById(id);
    if (!refund) throw new NotFoundException('Refund request not found');
    if (!refund.paymentIntentId)
      throw new InternalServerErrorException(
        'No paymentIntentId found for refund',
      );
    try {
      const stripeRefund = await this.stripe.refunds.create({
        payment_intent: refund.paymentIntentId,
        amount: refund.amount, // For VND, use amount as-is
        reason: 'requested_by_customer',
      });
      refund.status = 'approved';
      refund.adminNotes = adminNotes;
      await refund.save();
      this.logRefundAudit({
        action: 'stripe_approved_manual',
        refundId: refund._id,
        orderId: refund.orderId,
        userId: refund.userId,
        amount: refund.amount,
        reason: refund.reason,
      });
      return { refund, stripeRefund };
    } catch (err: any) {
      this.logRefundAudit({
        action: 'stripe_failed_manual',
        refundId: refund._id,
        orderId: refund.orderId,
        userId: refund.userId,
        amount: refund.amount,
        reason: String(err?.message ?? err),
      });
      throw new InternalServerErrorException(
        'Stripe refund failed: ' + (err.message || err),
      );
    }
  }

  async rejectRefund(id: string, adminNotes?: string) {
    const refund = await this.refundModel.findById(id);
    if (!refund) throw new NotFoundException('Refund request not found');
    refund.status = 'rejected';
    refund.adminNotes = adminNotes;
    await refund.save();
    return refund;
  }

  async completeRefund(id: string) {
    const refund = await this.refundModel.findById(id);
    if (!refund) throw new NotFoundException('Refund request not found');
    if (refund.status !== 'approved')
      throw new InternalServerErrorException(
        'Refund must be approved before completion',
      );
    refund.status = 'completed';
    await refund.save();
    return refund;
  }

  async getRefundRequestsByUser(userId: string) {
    return this.refundModel.find({ userId }).exec();
  }

  async getRefundRequestById(id: string) {
    return this.refundModel.findById(id).exec();
  }
}
