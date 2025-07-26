import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/product.dto';
import { ApiOperation, ApiResponse, ApiQuery, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { RoleGuard } from '@/common/guards/role.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductQueryDto } from './dto/product-query.dto';

@ApiTags('Product')
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new product' })
  @ApiResponse({ status: 201, description: 'Product created successfully' })
  create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get paginated products with filters' })
  @ApiResponse({ status: 200, description: 'List of products' })
  findAll(@Query() query: ProductQueryDto) {
    return this.productService.findAll(query);
  }

  @Get('returned-skus')
  @ApiOperation({
    summary: 'Get products with returned SKUs only',
    description:
      'Returns products with SKUs that have returnedStock > 0. Supports all filters and pagination, and only populates returned SKUs.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  @ApiQuery({ name: 'name', required: false, type: String })
  @ApiQuery({ name: 'brand', required: false, type: String })
  @ApiQuery({ name: 'ingredients', required: false, type: String })
  @ApiQuery({ name: 'skinConcerns', required: false, type: String })
  @ApiQuery({ name: 'suitableForSkinTypes', required: false, type: String })
  @ApiQuery({ name: 'minPrice', required: false, type: Number })
  @ApiQuery({ name: 'maxPrice', required: false, type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of products with returned SKUs only',
    schema: {
      example: {
        data: [
          {
            _id: 'productId',
            name: 'Product Name',
            brand: 'Brand',
            skus: [
              {
                _id: 'skuId',
                price: 100000,
                returnedStock: 2,
                isReturned: true,
                discountedPrice: 80000,
                // ...other SKU fields
              },
            ],
            // ...other product fields
          },
        ],
        meta: {
          totalItems: 1,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
        },
      },
    },
  })
  findReturnedSkus(@Query() query) {
    return this.productService.findReturnedSkus(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponse({ status: 200, description: 'Product found' })
  findById(@Param('id') id: string) {
    return this.productService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Update product' })
  @ApiResponse({ status: 200, description: 'Product updated' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Soft delete product' })
  @ApiResponse({ status: 200, description: 'Product soft deleted' })
  softDelete(@Param('id') id: string) {
    return this.productService.softDelete(id);
  }
}
