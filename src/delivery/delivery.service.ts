import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Delivery, DeliveryDocument } from './schemas/delivery.schema';
import { Model, Types } from 'mongoose';
import { UserService } from '@/user/user.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignDeliveryPersonnelDto } from './dto/assign-delivery-personnel.dto';
import {
  DeliveryStatus,
  UpdateDeliveryStatusDto,
} from './dto/update-delivery-status.dto';
import { UploadProofOfDeliveryDto } from './dto/upload-proof-of-delivery.dto';
import { OrderService } from '@/order/order.service';
import { SkuService } from '@/sku/sku.service';

const allowedTransitions: Record<DeliveryStatus, DeliveryStatus[]> = {
  [DeliveryStatus.PENDING]: [
    DeliveryStatus.ASSIGNED,
    DeliveryStatus.CANCELLED,
    DeliveryStatus.FAILED,
  ],
  [DeliveryStatus.ASSIGNED]: [
    DeliveryStatus.OUT_FOR_DELIVERY,
    DeliveryStatus.CANCELLED,
    DeliveryStatus.FAILED,
  ],
  [DeliveryStatus.OUT_FOR_DELIVERY]: [
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
  ],
  [DeliveryStatus.DELIVERED]: [],
  [DeliveryStatus.CANCELLED]: [],
  [DeliveryStatus.FAILED]: [],
};

@Injectable()
export class DeliveryService {
  constructor(
    @InjectModel(Delivery.name) private deliveryModel: Model<DeliveryDocument>,
    private readonly userService: UserService,
    private readonly orderService: OrderService,
    private readonly skuService: SkuService,
  ) {}

  async createDelivery(dto: CreateDeliveryDto): Promise<DeliveryDocument> {
    const order = await this.orderService.findById(dto.orderId);
    if (!order) throw new NotFoundException('Order not found');

    const user = await this.userService.findById(dto.customerId);
    if (!user) throw new NotFoundException('Customer not found');

    const existing = await this.deliveryModel.findOne({ orderId: dto.orderId });
    if (existing)
      throw new BadRequestException('Delivery already exists for this order');

    const delivery = new this.deliveryModel({
      ...dto,
      status: 'pending',
      estimatedDeliveryDate: dto.estimatedDeliveryDate
        ? new Date(dto.estimatedDeliveryDate)
        : undefined,
    });

    return delivery.save();
  }

  async assignDeliveryPersonnel(
    deliveryId: string,
    dto: AssignDeliveryPersonnelDto,
  ): Promise<DeliveryDocument> {
    const delivery = await this.deliveryModel.findById(deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');

    const user = await this.userService.findById(dto.deliveryPersonnelId);
    if (!user || user.role !== 'delivery') {
      throw new ForbiddenException('Invalid delivery personnel');
    }

    delivery.deliveryPersonnelId = new Types.ObjectId(dto.deliveryPersonnelId);
    delivery.status = 'assigned';
    return delivery.save();
  }

  async updateStatus(deliveryId: string, dto: UpdateDeliveryStatusDto) {
    const delivery = await this.deliveryModel.findById(deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');

    const currentStatus = delivery.status as DeliveryStatus;
    const nextStatus = dto.status;

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Cannot change status from ${currentStatus} to ${nextStatus}`,
      );
    }

    delivery.status = nextStatus;
    if (nextStatus === DeliveryStatus.DELIVERED) {
      if (delivery.requiresSignature && !delivery.proofOfDeliveryUrl) {
        throw new BadRequestException(
          'Cannot mark as delivered. Proof of delivery is required.',
        );
      }
      delivery.deliveryDate = new Date();
    }

    // If delivery failed, restock SKUs to normal stock
    if (nextStatus === DeliveryStatus.FAILED) {
      // Find the order and restock each SKU
      const order = await this.orderService.findById(String(delivery.orderId));
      if (order && Array.isArray(order.items)) {
        for (const item of order.items) {
          // Increment normal stock for each SKU using SkuService
          await this.skuService
            .getSkuModel()
            .findByIdAndUpdate(
              String(item.skuId),
              { $inc: { stock: item.quantity } },
              { new: true },
            );
          // Optionally, add audit log here
        }
      }
    }
    return delivery.save();
  }

  async uploadProof(
    deliveryId: string,
    dto: UploadProofOfDeliveryDto,
  ): Promise<DeliveryDocument> {
    const delivery = await this.deliveryModel.findById(deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');

    if (delivery.status !== 'out_for_delivery') {
      throw new BadRequestException(
        'Proof can only be uploaded when delivery is in progress',
      );
    }

    delivery.proofOfDeliveryUrl = dto.proofOfDeliveryUrl;
    if (dto.deliveryNotes) {
      delivery.deliveryNotes = dto.deliveryNotes;
    }

    return delivery.save();
  }

  async attachProofUrl(deliveryId: string, url: string) {
    const delivery = await this.deliveryModel.findById(deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    delivery.proofOfDeliveryUrl = url;
    return delivery.save();
  }

  async getById(deliveryId: string) {
    const delivery = await this.deliveryModel.findById(deliveryId);
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async getAllByCustomer(
    customerId: string,
    {
      page = 1,
      limit = 10,
      search,
      status,
    }: {
      page?: number;
      limit?: number;
      search?: string;
      status?: DeliveryStatus;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      customerId: customerId,
    };

    if (status) filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { trackingNumber: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
        { 'shippingAddress.street': regex },
      ];
    }

    const [data, totalItems] = await Promise.all([
      this.deliveryModel.find(filter).skip(skip).limit(limit),
      this.deliveryModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async getAllAssignedToPersonnel(
    deliveryPersonnelId: string,
    {
      page = 1,
      limit = 10,
      search,
      status,
    }: {
      page?: number;
      limit?: number;
      search?: string;
      status?: DeliveryStatus;
    } = {},
  ) {
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      deliveryPersonnelId: new Types.ObjectId(deliveryPersonnelId),
    };

    if (status) filter.status = status;

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { trackingNumber: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
        { 'shippingAddress.street': regex },
      ];
    }

    const [data, totalItems] = await Promise.all([
      this.deliveryModel.find(filter).skip(skip).limit(limit),
      this.deliveryModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  async getAllAdminView({
    page = 1,
    limit = 10,
    search,
    status,
  }: {
    page?: number;
    limit?: number;
    search?: string;
    status?: DeliveryStatus;
  }) {
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (status) {
      filter.status = status;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { trackingNumber: regex },
        { 'shippingAddress.fullName': regex },
        { 'shippingAddress.phone': regex },
        { 'shippingAddress.street': regex },
      ];
    }

    const [data, totalItems] = await Promise.all([
      this.deliveryModel.find(filter).skip(skip).limit(limit),
      this.deliveryModel.countDocuments(filter),
    ]);

    return {
      data,
      meta: {
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page,
        limit,
      },
    };
  }

  /**
   * Admin: Get all users with delivery role, with separate regex filters and pagination
   */
  async getAllDeliveryPersonnelAdmin({
    page = 1,
    limit = 10,
    email,
    name,
    phone,
  }: {
    page?: number;
    limit?: number;
    email?: string;
    name?: string;
    phone?: string;
  }) {
    // Use public method from UserService
    return this.userService.findDeliveryPersonnel({
      page,
      limit,
      email,
      name,
      phone,
    });
  }
}
