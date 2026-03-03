export interface Product {
  id: string;
  sku: string;
  name: string;
  image: string;
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
}

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