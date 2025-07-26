import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Param,
  Patch,
  Query,
  Get,
} from '@nestjs/common';

import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { ReturnService } from './return.service';
import { FirebaseService } from '@/firebase/firebase.service';
import { Roles } from '@/common/decorators/roles.decorator';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminRejectReturnDto } from './dto/admin-reject-return.dto';

@ApiTags('Return')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('return')
export class ReturnController {
  constructor(
    private readonly returnService: ReturnService,
    private readonly firebaseService: FirebaseService,
  ) {}

  /**
   * Admin: Get all return requests with pagination and filter by user email
   */
  @Get('admin/all')
  @Roles('admin')
  @ApiOperation({
    summary:
      'Admin: Get all return requests with pagination and filter by user email',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiQuery({
    name: 'email',
    required: false,
    type: String,
    description: 'Filter by user email',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of return requests with pagination and user email filter',
  })
  async getAllReturnRequestsAdmin(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('email') email?: string,
  ) {
    const pageNum = page && !isNaN(page) ? page : 1;
    const limitNum = limit && !isNaN(limit) ? limit : 10;
    return this.returnService.getAllReturnRequestsAdmin(
      pageNum,
      limitNum,
      email,
    );
  }

  @Post('request')
  @ApiOperation({
    summary: 'Submit a return request with images',
    description:
      'Conditions: Only allowed for delivered orders. Duplicate requests for the same order/SKU are not allowed unless previous requests are rejected or completed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          format: 'mongoid',
          example: '683d54bbf9076e4042ec1c2e',
          description: 'Order ID (must be delivered)',
        },
        reason: {
          type: 'string',
          example: 'Product damaged during shipping',
          description: 'Reason for return',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload images as files',
        },
      },
      required: ['orderId', 'reason'],
      description:
        'Conditions: Only allowed for delivered orders. Duplicate requests for the same order are not allowed unless previous requests are rejected or completed.',
    },
  })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  @UseInterceptors(FilesInterceptor('images'))
  async createReturnRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReturnRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    let imageUrls: string[] = [];
    if (files && files.length > 0) {
      imageUrls = await Promise.all(
        files.map((file) =>
          this.firebaseService.uploadFile(
            file.buffer,
            file.originalname,
            file.mimetype,
          ),
        ),
      );
    }
    // Pass imageUrls to service
    return this.returnService.createReturnRequest(user.sub, {
      ...dto,
      images: imageUrls,
    });
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Admin: Approve a return request' })
  @ApiOperation({
    summary: 'Submit a return request with images',
    description:
      'Conditions: Only allowed for delivered orders. Duplicate requests for the same order/SKU are not allowed unless previous requests are rejected or completed.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          format: 'mongoid',
          example: '683d54bbf9076e4042ec1c2e',
          description: 'Order ID (must be delivered)',
        },
        reason: {
          type: 'string',
          example: 'Product damaged during shipping',
          description: 'Reason for return',
        },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload images as files',
        },
      },
      required: ['orderId', 'reason'],
      description:
        'Conditions: Only allowed for delivered orders. Duplicate requests for the same order are not allowed unless previous requests are rejected or completed.',
    },
  })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  @UseInterceptors(FilesInterceptor('images'))
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          format: 'mongoid',
          example: '683d54bbf9076e4042ec1c2e',
        },
        reason: { type: 'string', example: 'Product damaged during shipping' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload images as files',
        },
      },
      required: ['orderId', 'reason'],
    },
  })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  async approveReturnRequest(@Param('id') id: string) {
    return this.returnService.approveReturnRequest(id);
  }

  @Patch('reject/:id')
  @Roles('admin')
  @ApiOperation({
    summary: 'Admin: Reject a return request',
    description:
      'Reject a return request with a specific reason and optional notes.',
  })
  @ApiParam({ name: 'id', required: true })
  @ApiBody({ type: AdminRejectReturnDto })
  @ApiResponse({ status: 200, description: 'Return request rejected' })
  async rejectReturnRequest(
    @Param('id') id: string,
    @Body() dto: AdminRejectReturnDto,
  ) {
    return this.returnService.rejectReturnRequest(
      id,
      dto.reason,
      dto.adminNotes,
    );
  }
}
