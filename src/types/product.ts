// ─── Product Types ──────────────────────────────────────────────────────────

/**
 * A single image in a product's gallery, optionally tagged with a color.
 * `color: null` means the image should be shown for ALL color selections
 * (e.g. lifestyle shots, packaging, scale references).
 */
export interface GalleryImage {
  url: string;
  color: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;

  /** Primary image URL — used by cards, cart, related strips. */
  image: string;

  /**
   * Full gallery, in display order. The first entry's URL mirrors `image`.
   * Each entry can be tagged with a color; the PDP uses these tags to
   * filter the thumbnail strip when the customer picks a swatch.
   * Optional — single-image products and the mock catalog don't need it;
   * `getGallery()` in the PDP falls back to `[{ url: image, color: null }]`.
   */
  gallery?: GalleryImage[];

  description?: string;
  diamondCaratOptions: number[];
  selectedCarat: number;
  goldWt18k: number;
  goldWt14k: number;
  diamondWt: number;
  category: string;
  silver925: number;
  price: number;
  subCategory: SubCategory;
  size: number;
  gender?: Gender;
  isActive?: boolean;

  /**
   * Material slugs the piece is offered in. Used by the category-page
   * Material filter. Allowed slugs (matching the customer-facing labels):
   *   - "10k-gold"        → 10k Gold
   *   - "10k-white-gold"  → 10k White Gold
   *   - "10k-rose-gold"   → 10k Rose Gold
   *   - "14k-gold"        → 14k Gold
   *   - "14k-white-gold"  → 14k White Gold
   *   - "14k-rose-gold"   → 14k Rose Gold
   *
   * Optional — products without this field simply won't match any
   * material filter selection until Jina tags them in the admin panel.
   */
  materials?: string[];
}

/**
 * Pulls the unique color tags out of a gallery, in the order they first
 * appear. Untagged images (color === null) are NOT counted as a color —
 * they're shown for every color.
 */
export function availableColors(gallery: GalleryImage[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const img of gallery) {
    if (img.color && !seen.has(img.color)) {
      seen.add(img.color);
      out.push(img.color);
    }
  }
  return out;
}

/**
 * Returns the gallery filtered to a given color. Untagged images are
 * always included so lifestyle/scale shots show up in every color view.
 * If no images match the color (and there are no untagged images either),
 * falls back to the full gallery so the page never goes blank.
 */
export function galleryForColor(
  gallery: GalleryImage[],
  color: string | null
): GalleryImage[] {
  if (!color) return gallery;
  const filtered = gallery.filter((g) => g.color === color || g.color === null);
  return filtered.length > 0 ? filtered : gallery;
}

export type Gender = "WOMEN" | "MEN" | "UNISEX";

export type SubCategory =
  | "ALL"
  | "LOOSE_BRACELET"
  | "EARRING"
  | "RING"
  | "PENDANT";

export type Category =
  | "ETERNITY_COLLECTION"
  | "FOUR_DIAMOND_COLLECTION"
  | "FULL_JACKET_COLLECTION"
  | "HALF_JACKET_COLLECTION"
  | "SINGLE_DIAMOND_COLLECTION"
  | "THREE_DIAMOND_COLLECTION"
  | "TWO_DIAMOND_COLLECTION";

export interface FilterState {
  subCategory: SubCategory | null;
  diamondCarat: number[];
  sizes: number[];
  priceMin: number | null;
  priceMax: number | null;
  category: Category[];
  silver925Min: number | null;
  silver925Max: number | null;
  diamondWtMin: number | null;
  diamondWtMax: number | null;
  goldWt14kMin: number | null;
  goldWt14kMax: number | null;
  goldWt18kMin: number | null;
  goldWt18kMax: number | null;
}

export const defaultFilterState: FilterState = {
  subCategory: null,
  diamondCarat: [],
  sizes: [],
  priceMin: null,
  priceMax: null,
  category: [],
  silver925Min: null,
  silver925Max: null,
  diamondWtMin: null,
  diamondWtMax: null,
  goldWt14kMin: null,
  goldWt14kMax: null,
  goldWt18kMin: null,
  goldWt18kMax: null,
};