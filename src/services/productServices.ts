import { supabase } from "../lib/supabase";
import { config } from "../lib/config";
import { getImageUrl } from "../utils/images";
import type { ProductRow } from "../types/database";
import type { Product, FilterState } from "../types/product";

// ─── Response types ──────────────────────────────────────────────────────────

export interface ProductListResult {
  products: Product[];
  totalCount: number;
  page: number;
  totalPages: number;
}

// ─── Transform DB row → frontend Product ─────────────────────────────────────

function rowToProduct(row: ProductRow, caratOptions: number[]): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    image: getImageUrl(row.image_path),
    diamondCaratOptions: caratOptions,
    selectedCarat: row.default_carat,
    goldWt18k: row.gold_wt_18k,
    goldWt14k: row.gold_wt_14k,
    diamondWt: row.diamond_wt,
    category: row.category,
    silver925: row.silver_925,
    price: row.price,
    subCategory: row.sub_category,
    size: row.size,
  };
}

// ─── Fetch products with filters + pagination ────────────────────────────────

export async function fetchProducts(
  filters: FilterState,
  page: number = 1
): Promise<ProductListResult> {
  const perPage = config.productsPerPage;
  const from = (page - 1) * perPage;
  const to = from + perPage - 1;

  // Start building the query
  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .order("sort_order", { ascending: true })
    .range(from, to);

  // ── Apply filters ──────────────────────────────────────────────────────

  if (filters.subCategory && filters.subCategory !== "ALL") {
    query = query.eq("sub_category", filters.subCategory);
  }

  if (filters.category.length > 0) {
    query = query.in("category", filters.category);
  }

  if (filters.priceMin !== null) {
    query = query.gte("price", filters.priceMin);
  }
  if (filters.priceMax !== null) {
    query = query.lte("price", filters.priceMax);
  }

  if (filters.silver925Min !== null) {
    query = query.gte("silver_925", filters.silver925Min);
  }
  if (filters.silver925Max !== null) {
    query = query.lte("silver_925", filters.silver925Max);
  }

  if (filters.diamondWtMin !== null) {
    query = query.gte("diamond_wt", filters.diamondWtMin);
  }
  if (filters.diamondWtMax !== null) {
    query = query.lte("diamond_wt", filters.diamondWtMax);
  }

  if (filters.goldWt14kMin !== null) {
    query = query.gte("gold_wt_14k", filters.goldWt14kMin);
  }
  if (filters.goldWt14kMax !== null) {
    query = query.lte("gold_wt_14k", filters.goldWt14kMax);
  }

  if (filters.goldWt18kMin !== null) {
    query = query.gte("gold_wt_18k", filters.goldWt18kMin);
  }
  if (filters.goldWt18kMax !== null) {
    query = query.lte("gold_wt_18k", filters.goldWt18kMax);
  }

  if (filters.sizes.length > 0) {
    query = query.in("size", filters.sizes);
  }

  // ── Execute ────────────────────────────────────────────────────────────

  const { data: rows, count, error } = await query;

  if (error) {
    console.error("Supabase query error:", error);
    return { products: [], totalCount: 0, page, totalPages: 0 };
  }

  if (!rows || rows.length === 0) {
    return { products: [], totalCount: count ?? 0, page, totalPages: 0 };
  }

  // ── Fetch carat options for these products ─────────────────────────────

  const productIds = rows.map((r) => r.id);

  const { data: caratRows, error: caratError } = await supabase
    .from("product_carat_options")
    .select("product_id, carat_value")
    .in("product_id", productIds)
    .order("carat_value", { ascending: true });

  if (caratError) {
    console.error("Carat options query error:", caratError);
  }

  // Group carat options by product_id
  const caratMap = new Map<string, number[]>();
  caratRows?.forEach((cr) => {
    const existing = caratMap.get(cr.product_id) || [];
    existing.push(cr.carat_value);
    caratMap.set(cr.product_id, existing);
  });

  // ── Diamond carat filter (post-query, since it's on the join table) ────

  let products = rows.map((row) =>
    rowToProduct(row, caratMap.get(row.id) || [row.default_carat])
  );

  if (filters.diamondCarat.length > 0) {
    products = products.filter((p) =>
      filters.diamondCarat.some((c) => p.diamondCaratOptions.includes(c))
    );
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / perPage);

  return { products, totalCount, page, totalPages };
}

// ─── Fetch single product by ID ──────────────────────────────────────────────

export async function fetchProductById(id: string): Promise<Product | null> {
  const { data: row, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) return null;

  const { data: caratRows } = await supabase
    .from("product_carat_options")
    .select("carat_value")
    .eq("product_id", id)
    .order("carat_value", { ascending: true });

  const carats = caratRows?.map((cr) => cr.carat_value) || [row.default_carat];

  return rowToProduct(row, carats);
}

// ─── Fetch adjacent products for arrow navigation ────────────────────────────

export async function fetchAdjacentProduct(
  currentSortOrder: number,
  direction: "prev" | "next",
  filters: FilterState
): Promise<Product | null> {
  let query = supabase.from("products").select("*").limit(1);

  if (direction === "next") {
    query = query.gt("sort_order", currentSortOrder).order("sort_order", { ascending: true });
  } else {
    query = query.lt("sort_order", currentSortOrder).order("sort_order", { ascending: false });
  }

  // Apply same filters so navigation stays within the filtered set
  if (filters.subCategory && filters.subCategory !== "ALL") {
    query = query.eq("sub_category", filters.subCategory);
  }
  if (filters.category.length > 0) {
    query = query.in("category", filters.category);
  }

  const { data: rows, error } = await query;
  if (error || !rows || rows.length === 0) return null;

  const row = rows[0];
  const { data: caratRows } = await supabase
    .from("product_carat_options")
    .select("carat_value")
    .eq("product_id", row.id)
    .order("carat_value", { ascending: true });

  return rowToProduct(row, caratRows?.map((cr) => cr.carat_value) || [row.default_carat]);
}