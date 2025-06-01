import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CartItem } from './types/cart-item';

@Injectable()
export class CartService {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  private getCartKey(userId: string) {
    return `cart:user:${userId}`;
  }

  async getCart(userId: string) {
    return this.cache.get(this.getCartKey(userId));
  }

  async updateCart(userId: string, items: CartItem[]): Promise<CartItem[]> {
    await this.cache.set(this.getCartKey(userId), items, 7 * 24 * 60 * 60);
    return items;
  }

  async clearCart(userId: string) {
    await this.cache.del(this.getCartKey(userId));
  }
}
