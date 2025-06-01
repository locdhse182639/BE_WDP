export interface CartItem {
  skuId: string;
  productId: string;
  skuName: string;
  image?: string;
  quantity: number;
  selected?: boolean;
  addedAt?: Date;

  priceSnapshot: number;
  discountSnapshot?: number;

  stockSnapshot?: number;
}
