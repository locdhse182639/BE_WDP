import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { CheckoutService } from './checkout.service';
import { CheckoutDto } from './dto/checkout.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Checkout')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post()
  @ApiOperation({
    summary: 'Initiate order checkout and create Stripe session',
  })
  @ApiResponse({ status: 201, description: 'Stripe session created' })
  async checkout(@CurrentUser() user: JwtPayload, @Body() dto: CheckoutDto) {
    return this.checkoutService.checkout(user.sub, dto);
  }
}
