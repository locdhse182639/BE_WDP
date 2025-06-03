import {
  Controller,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '@/auth/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtPayload } from '@/auth/types/jwt-payload';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CartItemDto } from './dto/cart-item.dto';
import { RemoveCartItemDto } from './dto/remove-cart-item.dto';
import { ToggleCartSelectionDto } from './dto/toggle-cart-selection.dto';
import { UpdateCartQuantityDto } from './dto/update-cart-quantity.dto';

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

  @Put('item')
  @ApiOperation({ summary: 'Replace cart with a new array of items' })
  @ApiResponse({ status: 200, description: 'Cart updated' })
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async updateCart(
    @CurrentUser() user: JwtPayload,
    @Body() items: CartItemDto[],
  ) {
    return this.cartService.updateCart(user.sub, items);
  }

  @Post('item')
  @ApiOperation({ summary: 'Add or update a single item in cart' })
  @ApiResponse({ status: 200, description: 'Item added/updated in cart' })
  async addItemToCart(
    @CurrentUser() user: JwtPayload,
    @Body() item: CartItemDto,
  ) {
    return this.cartService.addOrUpdateItem(user.sub, item);
  }

  @Delete('item')
  @ApiOperation({ summary: 'Remove an item from the cart' })
  @ApiResponse({ status: 200, description: 'Item removed from cart' })
  async removeItem(
    @CurrentUser() user: JwtPayload,
    @Body() dto: RemoveCartItemDto,
  ) {
    return this.cartService.removeItem(user.sub, dto);
  }

  @Patch('item/select')
  @ApiOperation({ summary: 'Toggle selected status of a cart item' })
  @ApiResponse({ status: 200, description: 'Item selection updated' })
  async toggleSelection(
    @CurrentUser() user: JwtPayload,
    @Body() dto: ToggleCartSelectionDto,
  ) {
    return this.cartService.toggleSelection(user.sub, dto);
  }

  @Patch('item/quantity')
  @ApiOperation({ summary: 'Update quantity of a cart item' })
  @ApiResponse({ status: 200, description: 'Item quantity updated' })
  async updateQuantity(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateCartQuantityDto,
  ) {
    return this.cartService.updateItemQuantity(user.sub, dto);
  }
}
