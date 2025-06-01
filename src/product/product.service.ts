import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/product.shema';
import { CreateProductDto } from './dto/product.dto';
import { PaginationQueryDto } from '@/common/dto/pagination-query.dto';
import { Model } from 'mongoose';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto) {
    return this.productModel.create(dto);
  }

  async findAll(query: PaginationQueryDto) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { brand: regex },
        { ingredients: regex },
        { skinConcerns: regex },
      ];
    }

    const [data, totalItems] = await Promise.all([
      this.productModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate('skus')
        .lean(),
      this.productModel.countDocuments(filter),
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

  async findById(id: string) {
    return this.productModel.findById(id).populate('skus').lean();
  }

  async update(id: string, dto: UpdateProductDto) {
    return this.productModel.findByIdAndUpdate(id, dto, { new: true });
  }

  async softDelete(id: string) {
    return this.productModel.findByIdAndUpdate(id, { isDeleted: true });
  }
}
