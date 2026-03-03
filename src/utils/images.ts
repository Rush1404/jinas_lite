import { config } from "../lib/config";

/**
 * Resolves a product image_path to a full CDN URL.
 *
 * image_path in Supabase is relative, e.g. "products/LB0484.webp"
 * Full URL becomes: https://media.jinaslite.com/products/LB0484.webp
 */
export function getImageUrl(imagePath: string): string {
  if (!imagePath) return config.images.fallback;

  // Already a full URL (mock data / dev)
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const base = config.images.baseUrl.replace(/\/$/, "");
  return `${base}/${imagePath}`;
}

/** Expected image path for a given SKU (keeps naming consistent) */
export function getExpectedImagePath(sku: string): string {
  return `products/${sku.toUpperCase()}.webp`;
}

/** Attach to <img onerror> to swap in fallback */
export function handleImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  if (!img.src.endsWith(config.images.fallback)) {
    img.src = config.images.fallback;
  }
}