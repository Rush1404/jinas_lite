// ─── Supabase Generated Types ────────────────────────────────────────────────
// In a real project, run `npx supabase gen types typescript` to auto-generate.
// This manual version matches our schema exactly.
// ─────────────────────────────────────────────────────────────────────────────

export interface Database {
  public: {
    Tables: {
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: Partial<ProductInsert>;
      };
      product_carat_options: {
        Row: CaratOptionRow;
        Insert: CaratOptionInsert;
        Update: Partial<CaratOptionInsert>;
      };
    };
    Enums: {
      sub_category: "LOOSE_BRACELET" | "EARRING" | "RING" | "PENDANT";
      category:
        | "ETERNITY_COLLECTION"
        | "FOUR_DIAMOND_COLLECTION"
        | "FULL_JACKET_COLLECTION"
        | "HALF_JACKET_COLLECTION"
        | "SINGLE_DIAMOND_COLLECTION"
        | "THREE_DIAMOND_COLLECTION"
        | "TWO_DIAMOND_COLLECTION";
    };
  };
}

// ─── Row types (what you SELECT) ─────────────────────────────────────────────

export interface ProductRow {
  id: string;            // uuid, primary key
  sku: string;           // unique, e.g. "LB0484"
  name: string;
  image_path: string;    // relative path on home server, e.g. "products/LB0484.webp"
  default_carat: number;
  gold_wt_18k: number;
  gold_wt_14k: number;
  diamond_wt: number;
  category: Database["public"]["Enums"]["category"];
  sub_category: Database["public"]["Enums"]["sub_category"];
  silver_925: number;
  price: number;         // USD
  size: number;
  sort_order: number;    // for chronological navigation
  created_at: string;
  updated_at: string;
}

export interface CaratOptionRow {
  id: string;
  product_id: string;
  carat_value: number;
}

// ─── Insert types (what you INSERT) ──────────────────────────────────────────

export interface ProductInsert {
  sku: string;
  name: string;
  image_path: string;
  default_carat: number;
  gold_wt_18k: number;
  gold_wt_14k: number;
  diamond_wt: number;
  category: Database["public"]["Enums"]["category"];
  sub_category: Database["public"]["Enums"]["sub_category"];
  silver_925: number;
  price: number;
  size: number;
  sort_order?: number;
}

export interface CaratOptionInsert {
  product_id: string;
  carat_value: number;
}