// Add this new interface at the top (below your imports if you have any)
export interface ProductVariantImage {
  url: string;
  color: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  image: string;
  /** All images (primary + gallery). First entry mirrors `image`. */
  images?: string[];
  /** Array of available colors (e.g., ["Silver", "Gold"]) */
  colors?: string[]; 
  /** Images tied to specific colors */
  variantImages?: ProductVariantImage[]; 
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