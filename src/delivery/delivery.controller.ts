/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Body,
  Controller,
  Post,
  Param,
  Patch,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Get,
  Query,
} from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { AssignDeliveryPersonnelDto } from './dto/assign-delivery-personnel.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Roles } from '@/common/decorators/roles.decorator';
import { RoleGuard } from '@/common/guards/role.guard';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from '@/firebase/firebase.service';
import { Express } from 'express';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { FilterDeliveriesDto } from './dto/filter-deliveries.dto';
import { DeliveryStatus } from './dto/update-delivery-status.dto';

@ApiTags('Delivery')
@ApiBearerAuth()
@Controller('delivery')
export class DeliveryController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly firebaseService: FirebaseService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get('customer')
  @ApiOperation({ summary: 'Get all deliveries for the current customer' })
  @ApiResponse({ status: 200, description: 'Customer deliveries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', enum: DeliveryStatus, required: false })
  getCustomerDeliveries(
    @CurrentUser() user: JwtPayload,
    @Query() query: FilterDeliveriesDto,
  ) {
    return this.deliveryService.getAllByCustomer(user.sub, query);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('delivery')
  @Get('personnel')
  @ApiOperation({
    summary: 'Get deliveries assigned to current delivery personnel',
  })
  @ApiResponse({ status: 200, description: 'Assigned deliveries' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', enum: DeliveryStatus, required: false })
  getAssignedDeliveries(
    @CurrentUser() user: JwtPayload,
    @Query() query: FilterDeliveriesDto,
  ) {
    return this.deliveryService.getAllAssignedToPersonnel(user.sub, query);
  }

  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @Get()
  @ApiOperation({ summary: 'Admin: Get deliveries with filters & pagination' })
  @ApiResponse({ status: 200, description: 'Deliveries returned' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'status', enum: DeliveryStatus, required: false })
  getAllForAdmin(@Query() query: FilterDeliveriesDto) {
    return this.deliveryService.getAllAdminView(query);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Create a new delivery record' })
  @ApiResponse({ status: 201, description: 'Delivery created successfully' })
  @ApiBody({
    type: CreateDeliveryDto,
    examples: {
      default: {
        value: {
          orderId: '665f0b6cb9f9918b7f558b7e',
          customerId: '665f0b6cb9f9918b7f558b7f',
          shippingAddress: {
            fullName: 'John Doe',
            phone: '0988888888',
            street: '123 Nguyen Trai',
            city: 'Ho Chi Minh City',
            country: 'Vietnam',
            postalCode: '700000',
          },
          deliveryFee: 15000,
          trackingNumber: 'VN123456789',
          estimatedDeliveryDate: '2025-06-03T00:00:00Z',
          requiresSignature: true,
        },
      },
    },
  })
  createDelivery(@Body() dto: CreateDeliveryDto) {
    return this.deliveryService.createDelivery(dto);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({ summary: 'Assign delivery personnel to a delivery' })
  @ApiResponse({ status: 200, description: 'Delivery personnel assigned' })
  @ApiBody({
    type: AssignDeliveryPersonnelDto,
    examples: {
      default: {
        value: {
          deliveryPersonnelId: '665f0b6cb9f9918b7f558c00',
        },
      },
    },
  })
  assignPersonnel(
    @Param('id') deliveryId: string,
    @Body() dto: AssignDeliveryPersonnelDto,
  ) {
    return this.deliveryService.assignDeliveryPersonnel(deliveryId, dto);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin', 'delivery')
  @ApiOperation({ summary: 'Update delivery status' })
  @ApiResponse({ status: 200, description: 'Delivery status updated' })
  @ApiBody({
    type: UpdateDeliveryStatusDto,
    examples: {
      default: {
        value: {
          status: DeliveryStatus.OUT_FOR_DELIVERY,
        },
      },
    },
  })
  updateStatus(
    @Param('id') deliveryId: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.deliveryService.updateStatus(deliveryId, dto);
  }

  @Patch(':id/proof')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('delivery')
  @ApiOperation({ summary: 'Upload proof of delivery' })
  @ApiResponse({ status: 200, description: 'Proof of delivery recorded' })
  @UseInterceptors(FileInterceptor('file'))
  async uploadProof(
    @Param('id') deliveryId: string,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const { buffer, originalname, mimetype } = file;

    const url = await this.firebaseService.uploadFile(
      buffer,
      originalname,
      mimetype,
    );
    return this.deliveryService.attachProofUrl(deliveryId, url);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Get delivery by ID' })
  @ApiResponse({ status: 200, description: 'Delivery found' })
  getOne(@Param('id') id: string) {
    return this.deliveryService.getById(id);
  }

  @Get('admin/delivery-personnel')
  @UseGuards(JwtAuthGuard, RoleGuard)
  @Roles('admin')
  @ApiOperation({
    summary: 'Admin: Get all users with delivery role',
    description:
      'Returns all users with the delivery role. Supports separate regex filters for email, name, and phone. Pagination is available.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Regex filter for email',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Regex filter for full name',
  })
  @ApiQuery({
    name: 'phone',
    required: false,
    type: String,
    description: 'Regex filter for phone',
  })
  @ApiResponse({
    status: 200,
    description: 'List of delivery personnel with pagination',
  })
  async getAllDeliveryPersonnelAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('email') email?: string,
    @Query('name') name?: string,
    @Query('phone') phone?: string,
  ) {
    return this.deliveryService.getAllDeliveryPersonnelAdmin({
      page,
      limit,
      email,
      name,
      phone,
    });
  }
}
