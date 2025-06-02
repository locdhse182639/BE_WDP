import { Controller, Get, Put, Delete, Body, UseGuards } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import { CartItem } from './types/cart-item';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Cart')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiResponse({ status: 200, description: 'Returns the cart' })
  async getCart(@CurrentUser() user: JwtPayload) {
    return this.cartService.getCart(user.sub);
  }

  @Put()
  @ApiOperation({ summary: 'Replace cart with a new array of items' })
  @ApiResponse({ status: 200, description: 'Cart updated' })
  async updateCart(@CurrentUser() user: JwtPayload, @Body() items: CartItem[]) {
    return this.cartService.updateCart(user.sub, items);
  }

  @Delete()
  @ApiOperation({ summary: 'Clear current user cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared' })
  async clearCart(@CurrentUser() user: JwtPayload) {
    await this.cartService.clearCart(user.sub);
    return { message: 'Cart cleared' };
  }
}
