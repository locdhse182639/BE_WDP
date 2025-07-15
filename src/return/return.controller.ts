import {
  Controller,
  Post,
  Body,
  UseGuards,
  UploadedFiles,
  UseInterceptors,
  Param,
  Patch,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { CreateReturnRequestDto } from './dto/create-return-request.dto';
import { ReturnService } from './return.service';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

@ApiTags('Return')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('return')
export class ReturnController {
  constructor(private readonly returnService: ReturnService) {}

  @Post('request')
  @ApiOperation({ summary: 'Submit a return request with images' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          format: 'mongoid',
          example: '683d54bbf9076e4042ec1c2e',
        },
        skuId: {
          type: 'string',
          format: 'mongoid',
          example: '683d56708569c8587916411a',
        },
        reason: { type: 'string', example: 'Product damaged during shipping' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload images as files',
        },
      },
      required: ['orderId', 'skuId', 'reason'],
    },
  })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  @UseInterceptors(FilesInterceptor('images'))
  @ApiBearerAuth()
  @ApiTags('Return')
  @ApiOperation({ summary: 'Submit a return request with images' })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          format: 'mongoid',
          example: '683d54bbf9076e4042ec1c2e',
        },
        skuId: {
          type: 'string',
          format: 'mongoid',
          example: '683d56708569c8587916411a',
        },
        reason: { type: 'string', example: 'Product damaged during shipping' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload images as files',
        },
      },
      required: ['orderId', 'skuId', 'reason'],
    },
  })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  @ApiOperation({ summary: 'Submit a return request with images' })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        orderId: {
          type: 'string',
          format: 'mongoid',
          example: '683d54bbf9076e4042ec1c2e',
        },
        skuId: {
          type: 'string',
          format: 'mongoid',
          example: '683d56708569c8587916411a',
        },
        reason: { type: 'string', example: 'Product damaged during shipping' },
        images: {
          type: 'array',
          items: { type: 'string', format: 'binary' },
          description: 'Upload images as files',
        },
      },
      required: ['orderId', 'skuId', 'reason'],
    },
  })
  @ApiResponse({ status: 201, description: 'Return request submitted' })
  async createReturnRequest(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateReturnRequestDto,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.returnService.createReturnRequest(user.sub, dto, files);
  }

  @Patch('approve/:id')
  @ApiOperation({ summary: 'Admin: Approve a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminNotes: { type: 'string', example: 'Approved after inspection' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Return request approved' })
  async approveReturnRequest(
    @Param('id') requestId: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.returnService.approveReturnRequest(requestId, adminNotes);
  }

  @Patch('reject/:id')
  @ApiOperation({ summary: 'Admin: Reject a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminNotes: { type: 'string', example: 'Rejected due to damage' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Return request rejected' })
  async rejectReturnRequest(
    @Param('id') requestId: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.returnService.rejectReturnRequest(requestId, adminNotes);
  }

  @Patch('complete/:id')
  @ApiOperation({ summary: 'Admin: Complete a return request' })
  @ApiParam({ name: 'id', description: 'Return request ID' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        adminNotes: {
          type: 'string',
          example: 'Return processed and stock updated',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Return request completed' })
  async completeReturnRequest(
    @Param('id') requestId: string,
    @Body('adminNotes') adminNotes?: string,
  ) {
    return this.returnService.completeReturnRequest(requestId, adminNotes);
  }
}
