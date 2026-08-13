import { Product } from "../types/product.ts";

// Mock data — used in dev when Supabase isn't configured, and as a fallback
// in main.ts if Supabase returns nothing.
//
// Mock entries don't set `gallery` — `gallery` is optional on Product, and
// `getGallery()` in the PDP falls back to a one-entry gallery built from
// `image`. Color variants only kick in for products created via the admin
// portal (or imported with gallery rows in product_images).

export const mockProducts: Product[] = [

];