// ─── Cart Store ─────────────────────────────────────────────────────────────
// Tiny pub/sub store backed by localStorage. The cart survives reloads but
// stays per-device — fine for now; we can move it to a Supabase `carts` table
// later if we want cross-device sync.
// ────────────────────────────────────────────────────────────────────────────

import type { Cart, CartItem, OrderSummary } from "../types/cart";
import { config } from "./config";

const STORAGE_KEY = "jinas-lite:cart:v1";
type Listener = (cart: Cart) => void;

function emptyCart(): Cart {
  return { items: [] };
}

function readFromStorage(): Cart {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyCart();
    const parsed = JSON.parse(raw);
    // Defensive — if shape changed, reset rather than throw.
    if (!parsed || !Array.isArray(parsed.items)) return emptyCart();
    return parsed as Cart;
  } catch {
    return emptyCart();
  }
}

function writeToStorage(cart: Cart) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (err) {
    console.warn("Failed to persist cart:", err);
  }
}

class CartStore {
  private cart: Cart = readFromStorage();
  private listeners: Set<Listener> = new Set();

  getCart(): Cart {
    return this.cart;
  }

  itemCount(): number {
    return this.cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  add(item: CartItem) {
    const existing = this.cart.items.find((i) => i.sku === item.sku);
    if (existing) {
      existing.quantity += item.quantity;
    } else {
      this.cart.items.push({ ...item });
    }
    this.persistAndNotify();
  }

  setQuantity(sku: string, qty: number) {
    const item = this.cart.items.find((i) => i.sku === sku);
    if (!item) return;
    if (qty <= 0) {
      this.cart.items = this.cart.items.filter((i) => i.sku !== sku);
    } else {
      item.quantity = qty;
    }
    this.persistAndNotify();
  }

  remove(sku: string) {
    this.cart.items = this.cart.items.filter((i) => i.sku !== sku);
    this.persistAndNotify();
  }

  clear() {
    this.cart = emptyCart();
    this.persistAndNotify();
  }

  /** Subscribe to changes. Returns unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.cart); // emit current state immediately
    return () => this.listeners.delete(listener);
  }

  /** Compute totals. All values in cents. */
  summary(): OrderSummary {
    const subtotalCents = this.cart.items.reduce(
      (sum, item) => sum + item.unitPriceCents * item.quantity,
      0
    );
    const taxCents = Math.round(subtotalCents * config.taxRate);
    const shippingCents = subtotalCents > 0 ? config.shippingFlatCents : 0;
    return {
      subtotalCents,
      taxCents,
      shippingCents,
      totalCents: subtotalCents + taxCents + shippingCents,
    };
  }

  private persistAndNotify() {
    writeToStorage(this.cart);
    this.listeners.forEach((l) => l(this.cart));
  }
}

export const cartStore = new CartStore();

/** Format cents as "$X.XX" */
export function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}