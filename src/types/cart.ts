// ─── Cart & Order Types ─────────────────────────────────────────────────────

import type { Product } from "./product";

export interface CartItem {
  productId: string;
  sku: string;
  name: string;
  image: string;
  unitPriceCents: number; // store in cents to avoid float drift
  quantity: number;
}

export interface Cart {
  items: CartItem[];
}

export interface ShippingAddress {
  name: string;
  email: string;
  addr1: string;
  addr2?: string;
  city: string;
  region: string;       // Province / state
  postal: string;
  country: string;
}

export interface OrderSummary {
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
}

/** Helper — turn a Product into a CartItem */
export function productToCartItem(product: Product, qty: number = 1): CartItem {
  return {
    productId: product.id,
    sku: product.sku,
    name: product.name,
    image: product.image,
    unitPriceCents: Math.round(product.price * 100),
    quantity: qty,
  };
}