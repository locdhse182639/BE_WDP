import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Product, ProductDocument } from './schemas/product.shema';
import { CreateProductDto } from './dto/product.dto';
import { Model, Types } from 'mongoose';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@Injectable()
export class ProductService {
  async findReturnedSkus(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      name,
      brand,
      ingredients,
      skinConcerns,
      suitableForSkinTypes,
      minPrice,
      maxPrice,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (ingredients)
      filter.ingredients = {
        $in: Array.isArray(ingredients) ? ingredients : ingredients.split(','),
      };
    if (skinConcerns)
      filter.skinConcerns = {
        $in: Array.isArray(skinConcerns)
          ? skinConcerns
          : skinConcerns.split(','),
      };
    if (suitableForSkinTypes)
      filter.suitableForSkinTypes = {
        $in: Array.isArray(suitableForSkinTypes)
          ? suitableForSkinTypes
          : suitableForSkinTypes.split(','),
      };

    // SKU filter logic for returned SKUs only
    let productIdsBySku: Types.ObjectId[] | undefined = undefined;
    interface MongoSkuFilter {
      returnedStock?: { $gt: number };
      price?: { $gte?: number; $lte?: number };
    }
    const mongoSkuFilter: MongoSkuFilter = { returnedStock: { $gt: 0 } };
    if (minPrice !== undefined)
      mongoSkuFilter.price = { $gte: Number(minPrice) };
    if (maxPrice !== undefined) {
      mongoSkuFilter.price = {
        ...(mongoSkuFilter.price || {}),
        $lte: Number(maxPrice),
      };
    }
    const SkuModel = this.productModel.db.model('Sku');
    const skus = await SkuModel.find(mongoSkuFilter, 'productId');
    productIdsBySku = skus.map(
      (sku: { productId: Types.ObjectId }) => sku.productId,
    );
    filter._id = { $in: productIdsBySku };

    const [data, totalItems] = await Promise.all([
      this.productModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'skus',
          match: {
            returnedStock: { $gt: 0 },
            ...(mongoSkuFilter.price ? { price: mongoSkuFilter.price } : {}),
          },
        })
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
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  async create(dto: CreateProductDto) {
    return this.productModel.create(dto);
  }

  async findAll(query: ProductQueryDto) {
    const {
      page = 1,
      limit = 10,
      name,
      brand,
      ingredients,
      skinConcerns,
      suitableForSkinTypes,
      minPrice,
      maxPrice,
    } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {};
    if (name) filter.name = { $regex: name, $options: 'i' };
    if (brand) filter.brand = { $regex: brand, $options: 'i' };
    if (ingredients)
      filter.ingredients = {
        $in: Array.isArray(ingredients) ? ingredients : ingredients.split(','),
      };
    if (skinConcerns)
      filter.skinConcerns = {
        $in: Array.isArray(skinConcerns)
          ? skinConcerns
          : skinConcerns.split(','),
      };
    if (suitableForSkinTypes)
      filter.suitableForSkinTypes = {
        $in: Array.isArray(suitableForSkinTypes)
          ? suitableForSkinTypes
          : suitableForSkinTypes.split(','),
      };

    // SKU filter logic
    let productIdsBySku: Types.ObjectId[] | undefined = undefined;
    interface MongoSkuFilter {
      price?: { $gte?: number; $lte?: number };
    }
    const mongoSkuFilter: MongoSkuFilter = {};
    if (minPrice !== undefined)
      mongoSkuFilter.price = { $gte: Number(minPrice) };
    if (maxPrice !== undefined) {
      mongoSkuFilter.price = {
        ...(mongoSkuFilter.price || {}),
        $lte: Number(maxPrice),
      };
    }
    if (Object.keys(mongoSkuFilter).length > 0) {
      const SkuModel = this.productModel.db.model('Sku');
      const skus = await SkuModel.find(mongoSkuFilter, 'productId');
      productIdsBySku = skus.map(
        (sku: { productId: Types.ObjectId }) => sku.productId,
      );
      filter._id = { $in: productIdsBySku };
    }

    const [data, totalItems] = await Promise.all([
      this.productModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'skus',
          match:
            minPrice !== undefined || maxPrice !== undefined
              ? {
                  ...(minPrice !== undefined
                    ? { price: { $gte: Number(minPrice) } }
                    : {}),
                  ...(maxPrice !== undefined
                    ? {
                        price: {
                          ...(minPrice !== undefined
                            ? { $gte: Number(minPrice) }
                            : {}),
                          $lte: Number(maxPrice),
                        },
                      }
                    : {}),
                }
              : undefined,
        })
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
