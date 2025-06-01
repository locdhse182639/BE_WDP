import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AddressService } from './address.service';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { CreateAddressDto } from './dto/create-address.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';

@ApiTags('Address')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new address',
  })
  @ApiResponse({
    status: 201,
    description: 'Address created successfully',
  })
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateAddressDto) {
    return this.addressService.create(user.sub, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all addresses for current user' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved' })
  getAll(@CurrentUser() user: JwtPayload) {
    return this.addressService.findByUser(user.sub);
  }

  @Post(':id/set-default')
  @ApiOperation({ summary: 'Set address as default' })
  @ApiResponse({ status: 200, description: 'Default address set' })
  setDefault(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.addressService.setDefault(user.sub, id);
  }
}
