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

  async addOrUpdateItem(userId: string, item: CartItem): Promise<CartItem[]> {
    const key = this.getCartKey(userId);
    const cart: CartItem[] = ((await this.cache.get(key)) as CartItem[]) || [];

    const index = cart.findIndex(
      (ci) => ci.skuId === item.skuId && ci.productId === item.productId,
    );

    if (index > -1) {
      cart[index].quantity += item.quantity;
      cart[index].priceSnapshot = item.priceSnapshot;
      cart[index].discountSnapshot = item.discountSnapshot;
      cart[index].stockSnapshot = item.stockSnapshot;
      cart[index].addedAt = new Date();
    } else {
      cart.push({
        ...item,
        addedAt: new Date(),
        selected: true,
      });
    }

    await this.cache.set(key, cart, 7 * 24 * 60 * 60);
    return cart;
  }

  async removeItem(
    userId: string,
    dto: { skuId: string; productId: string },
  ): Promise<CartItem[]> {
    const key = this.getCartKey(userId);
    const cart: CartItem[] = ((await this.cache.get(key)) as CartItem[]) || [];

    const updatedCart = cart.filter(
      (item) => item.skuId !== dto.skuId || item.productId !== dto.productId,
    );

    await this.cache.set(key, updatedCart, 7 * 24 * 60 * 60);
    return updatedCart;
  }

  async toggleSelection(
    userId: string,
    dto: { skuId: string; productId: string; selected: boolean },
  ): Promise<CartItem[]> {
    const key = this.getCartKey(userId);
    const cart: CartItem[] = ((await this.cache.get(key)) as CartItem[]) || [];

    const updatedCart = cart.map((item) => {
      if (item.skuId === dto.skuId && item.productId === dto.productId) {
        return { ...item, selected: dto.selected };
      }
      return item;
    });

    await this.cache.set(key, updatedCart, 7 * 24 * 60 * 60);
    return updatedCart;
  }

  async updateItemQuantity(
    userId: string,
    dto: { skuId: string; productId: string; quantity: number },
  ): Promise<CartItem[]> {
    const key = this.getCartKey(userId);
    const cart: CartItem[] = ((await this.cache.get(key)) as CartItem[]) || [];

    const updatedCart = cart.map((item) =>
      item.skuId === dto.skuId && item.productId === dto.productId
        ? { ...item, quantity: dto.quantity }
        : item,
    );

    await this.cache.set(key, updatedCart, 7 * 24 * 60 * 60);
    return updatedCart;
  }
}
