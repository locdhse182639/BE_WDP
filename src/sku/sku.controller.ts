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
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { SkuService } from './sku.service';
import { FirebaseService } from '@/firebase/firebase.service';
import { CreateSkuDto } from './dto/create-sku.dto';
import { UpdateSkuDto } from './dto/update-sku.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';

@ApiTags('SKU')
@Controller('sku')
export class SkuController {
  /**
   * Replace an image in SKU by index
   */
  @Patch(':id/images/:imageIndex')
  @UseInterceptors(FilesInterceptor('file', 1))
  @ApiOperation({ summary: 'Replace an image in SKU by index' })
  @ApiParam({ name: 'id', description: 'SKU ID' })
  @ApiParam({
    name: 'imageIndex',
    description: 'Index of the image to replace (0-based)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Image replaced in SKU' })
  async replaceImage(
    @Param('id') id: string,
    @Param('imageIndex') imageIndex: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No file uploaded');
    }
    const idx = parseInt(imageIndex, 10);
    if (isNaN(idx)) {
      throw new BadRequestException('Invalid image index');
    }
    const file = files[0];
    const url = await this.firebaseService.uploadFile(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    return this.skuService.replaceImage(id, idx, url);
  }
  /**
   * Remove an image from SKU by index
   */
  @Delete(':id/images/:imageIndex')
  @ApiOperation({ summary: 'Remove an image from SKU by index' })
  @ApiParam({ name: 'id', description: 'SKU ID' })
  @ApiParam({
    name: 'imageIndex',
    description: 'Index of the image to remove (0-based)',
  })
  @ApiResponse({ status: 200, description: 'Image removed from SKU' })
  async removeImage(
    @Param('id') id: string,
    @Param('imageIndex') imageIndex: string,
  ) {
    const idx = parseInt(imageIndex, 10);
    if (isNaN(idx)) {
      throw new BadRequestException('Invalid image index');
    }
    return this.skuService.removeImage(id, idx);
  }
  constructor(
    private readonly skuService: SkuService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @Post(':id/images')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Upload images for a SKU (replace all images)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Images uploaded and SKU updated' })
  async uploadImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const urls: string[] = [];
    for (const file of files) {
      const url = await this.firebaseService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      urls.push(url);
    }
    // Use service method for updating all images
    return this.skuService.update(id, { images: urls });
  }
  /**
   * Add image(s) to SKU (append to images array)
   */
  @Post(':id/images/add')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiOperation({ summary: 'Add image(s) to SKU (append to images array)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Images added to SKU' })
  async addImages(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }
    const urls: string[] = [];
    for (const file of files) {
      const url = await this.firebaseService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
      );
      urls.push(url);
    }
    return this.skuService.addImages(id, urls);
  }

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
