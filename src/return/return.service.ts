import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ReturnRequest,
  ReturnRequestDocument,
  ReturnRejectReason,
} from './schemas/return-request.schema';
// Simple audit log function (could be replaced with a service or DB collection)
function logInventoryChange({ skuId, quantity, action, reason, userId }) {
  // In production, replace with DB insert or external logging
  // For demo, just console.log
  console.log(
    `[AUDIT] SKU ${skuId}: ${action} ${quantity} by user ${userId}${reason ? ' | Reason: ' + reason : ''}`,
  );
}
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { FirebaseService } from '@/firebase/firebase.service';
import { OrderService } from '@/order/order.service';
import { SkuService } from '@/sku/sku.service';
import { RefundService } from '@/refund/refund.service';
import { UserService } from '@/user/user.service';
import { EmailService } from '@/email/email.service';

@Injectable()
export class ReturnService {
  constructor(
    @InjectModel(ReturnRequest.name)
    private readonly returnRequestModel: Model<ReturnRequestDocument>,
    private readonly firebaseService: FirebaseService,
    private readonly orderService: OrderService,
    private readonly skuService: SkuService,
    private readonly refundService: RefundService,
    private readonly userService: UserService,
    private readonly emailService: EmailService,
  ) {}

  async createReturnRequest(userId: string, dto: CreateReturnRequestDto) {
    // Check order status
    const order = await this.orderService.findById(dto.orderId);
    if (!order) {
      throw new Error('Order not found');
    }
    if (order.orderStatus !== 'Delivered') {
      throw new Error('Return requests are only allowed for delivered orders');
    }

    // Prevent duplicate requests for same order/SKU unless previous is rejected/completed
    const existingRequest = await this.returnRequestModel.findOne({
      orderId: dto.orderId,
      userId,
      status: { $in: ['pending', 'approved'] },
    });
    if (existingRequest) {
      throw new Error('A return request for this order is already active');
    }

    const request = new this.returnRequestModel({
      ...dto,
      userId,
      status: 'pending',
    });
    return request.save();
  }

  async approveReturnRequest(requestId: string) {
    const session = await this.returnRequestModel.db.startSession();
    session.startTransaction();
    try {
      const request = await this.returnRequestModel
        .findById(requestId)
        .session(session);
      if (!request) {
        throw new Error('Return request not found');
      }
      if (request.status !== 'pending') {
        throw new Error('Return request is not pending');
      }
      request.status = 'approved';
      await request.save({ session });

      // Get order details
      const order = await this.orderService.findById(String(request.orderId));
      if (!order) {
        throw new Error('Order not found');
      }

      // Map to sum quantities for each SKU (handle duplicates)
      const skuQuantityMap = new Map();
      for (const item of order.items) {
        const skuId = String(item.skuId);
        const qty = item.quantity ?? 1;
        skuQuantityMap.set(skuId, (skuQuantityMap.get(skuId) ?? 0) + qty);
      }

      // Increment returnedStock for all SKUs in the order
      for (const [skuIdRaw, quantityRaw] of skuQuantityMap.entries()) {
        const skuId: string = String(skuIdRaw);
        const quantity: number = Number(quantityRaw);
        await this.skuService.getSkuModel().findByIdAndUpdate(
          skuId,
          {
            $inc: { returnedStock: quantity },
            $set: { isReturned: true },
          },
          { new: true, session },
        );
        // Audit log for each SKU
        logInventoryChange({
          skuId,
          quantity,
          action: 'return_approved',
          reason: undefined,
          userId: request.userId,
        });
      }

      // Send email notification for return approval
      const user = await this.userService.findById(String(request.userId));
      if (user && user.email) {
        await this.emailService.sendMail(
          user.email,
          'Your return request has been approved',
          `<p>Your return request for order ${String(request.orderId)} has been approved. We will process your refund shortly.</p>`,
        );
      }

      // Automatically trigger refund for the whole order
      if (order && order.paymentIntentId) {
        await this.refundService.createRefundRequest(
          String(order._id),
          String(request.userId),
          order.totalAmount,
          'Return approved (whole order)',
          order.paymentIntentId,
        );
        // Send email notification for refund initiation
        if (user && user.email) {
          await this.emailService.sendMail(
            user.email,
            'Your refund has been initiated',
            `<p>Your refund for order ${String(order._id)} has been initiated and will be processed via Stripe. You will receive a confirmation once completed.</p>`,
          );
        }
      } else {
        console.log('[DEBUG] No paymentIntentId found, refund not triggered.');
      }

      await session.commitTransaction();
      await session.endSession();
      return request;
    } catch (err) {
      await session.abortTransaction();
      await session.endSession();
      throw err;
    }
  }

  async rejectReturnRequest(
    id: string,
    reason: ReturnRejectReason,
    adminNotes?: string,
  ) {
    const request = await this.returnRequestModel.findById(id);
    if (!request) throw new NotFoundException('Return request not found');
    request.status = 'rejected';
    request.adminRejectReason = reason;
    request.adminNotes = adminNotes;
    await request.save();
    // Audit log for rejection: log each SKU in the order
    const order = await this.orderService.findById(String(request.orderId));
    if (order && Array.isArray(order.items)) {
      for (const item of order.items) {
        logInventoryChange({
          skuId: item.skuId,
          quantity: item.quantity ?? 1,
          action: 'return_rejected',
          reason,
          userId: request.userId,
        });
      }
    }
    return request;
  }

  async completeReturnRequest(requestId: string, adminNotes?: string) {
    const request = await this.returnRequestModel.findById(requestId);
    if (!request) {
      throw new Error('Return request not found');
    }
    if (request.status !== 'approved') {
      throw new Error('Return request must be approved before completion');
    }
    request.status = 'completed';
    if (adminNotes) request.adminNotes = adminNotes;
    await request.save();
    return request;
  }

  /**
   * Admin: Get all return requests with pagination and filter by user email
   */
  async getAllReturnRequestsAdmin(
    page?: number,
    limit?: number,
    email?: string,
  ) {
    const pageNum = Number(page) > 0 ? Number(page) : 1;
    const limitNum = Number(limit) > 0 ? Number(limit) : 10;
    const filter: Record<string, any> = {};
    if (email) {
      const users = await this.userService.findByEmailPartial(email);
      const userIds = users.map((u) => u._id);
      if (userIds.length > 0) {
        filter.userId = { $in: userIds };
      } else {
        return {
          rawData: [],
          meta: {
            totalItems: 0,
            totalPages: 0,
            currentPage: pageNum,
            limit: limitNum,
          },
        };
      }
    }
    const totalItems = await this.returnRequestModel.countDocuments(filter);
    const data = await this.returnRequestModel
      .find(filter)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .populate({ path: 'userId', select: 'email' })
      .lean();

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
        currentPage: pageNum,
        limit: limitNum,
      },
    };
  }
}
