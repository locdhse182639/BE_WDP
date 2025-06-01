// src/sku/sku.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import { SkuService } from './sku.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('SKU')
@Controller('sku')
export class SkuController {
  constructor(private readonly skuService: SkuService) {}

  @Post()
  @ApiOperation({ summary: 'Create SKU for a product' })
  @ApiResponse({ status: 201, description: 'SKU created successfully' })
  async create(@Body() dto: CreateSkuDto) {
    return this.skuService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List SKUs with pagination and search' })
  @ApiResponse({ status: 200, description: 'List of SKUs' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'productId', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('productId') productId?: string,
  ) {
    return this.skuService.findAll({ page, limit, search, productId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get SKU by ID' })
  @ApiParam({ name: 'id' })
  async findOne(@Param('id') id: string) {
    return this.skuService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update SKU by ID' })
  @ApiParam({ name: 'id' })
  async update(@Param('id') id: string, @Body() dto: UpdateSkuDto) {
    return this.skuService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete SKU by ID' })
  @ApiParam({ name: 'id' })
  async remove(@Param('id') id: string) {
    return this.skuService.remove(id);
  }
}
