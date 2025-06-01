import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Sku, SkuDocument } from './schemas/sku.schema';
import { Model } from 'mongoose';
import { CreateSkuDto } from './dto/create-sku.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';

@Injectable()
export class SkuService {
  constructor(
    @InjectModel(Sku.name) private readonly skuModel: Model<SkuDocument>,
  ) {}

  async create(dto: CreateSkuDto) {
    return this.skuModel.create(dto);
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { variantName: regex },
        { batchCode: regex },
        { status: regex },
        { formulationType: regex },
      ];
    }

    const [data, totalItems] = await Promise.all([
      this.skuModel.find(filter).skip(skip).limit(limit).populate('productId'),
      this.skuModel.countDocuments(filter),
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

  async findById(id: string): Promise<Sku> {
    const sku = await this.skuModel.findById(id).populate('productId');
    if (!sku) throw new NotFoundException('SKU not found');
    return sku;
  }

  async update(id: string, dto: UpdateSkuDto): Promise<Sku> {
    const updated = await this.skuModel
      .findByIdAndUpdate(id, dto, { new: true })
      .populate('productId');
    if (!updated) throw new NotFoundException('SKU not found');
    return updated;
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.skuModel.findByIdAndDelete(id);
    if (!deleted) throw new NotFoundException('SKU not found');
  }
}
