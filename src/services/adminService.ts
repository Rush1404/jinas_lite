// ─── Admin Service ──────────────────────────────────────────────────────────
// All product CRUD called from the admin portal. Uses Supabase when
// configured; falls back to in-memory mutation of mockProducts in dev so the
// portal is usable before Supabase is hooked up.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";
import { config } from "../lib/config";
import { mockProducts } from "../data/products";
import { getImageUrl } from "../utils/images";
import type {
  Product,
  GalleryImage,
  SubCategory,
  Category,
  Gender,
} from "../types/product";

export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  /** Primary image URL (kept in sync with gallery[0].url). */
  image: string;
  /** Full gallery, in display order. First entry is the primary. */
  gallery?: GalleryImage[];
  price: number;
  goldWt18k: number;
  goldWt14k: number;
  diamondWt: number;
  silver925: number;
  size: number;
  selectedCarat: number;
  category: Category;
  subCategory: SubCategory;
  gender: Gender;
  isActive?: boolean;
}

const isSupabaseConfigured = () =>
  Boolean(config.supabase.url) && Boolean(config.supabase.anonKey);

// ─── Bulk load galleries ────────────────────────────────────────────────────
async function loadGalleries(
  productIds: string[]
): Promise<Map<string, GalleryImage[]>> {
  const map = new Map<string, GalleryImage[]>();
  if (productIds.length === 0) return map;

  const { data, error } = await supabase
    .from("product_images")
    .select("product_id, image_path, is_primary, sort_order, color")
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("loadGalleries:", error);
    return map;
  }

  data?.forEach((r: any) => {
    const existing = map.get(r.product_id) ?? [];
    existing.push({
      url: getImageUrl(r.image_path),
      color: r.color ?? null,
    });
    map.set(r.product_id, existing);
  });
  return map;
}

// ─── List ───────────────────────────────────────────────────────────────────
export async function listAllProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    return [...mockProducts];
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("listAllProducts:", error);
    return [];
  }

  const rows = data ?? [];
  // Admin list view doesn't need full galleries — just primary thumb.
  return rows.map((r) => rowToProduct(r, []));
}

// ─── Get single ─────────────────────────────────────────────────────────────
export async function getProductBySku(sku: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    return mockProducts.find((p) => p.sku.toUpperCase() === sku.toUpperCase()) ?? null;
  }

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("sku", sku.toUpperCase())
    .maybeSingle();

  if (error || !data) return null;

  // Load this product's gallery so the edit form can prefill it.
  const galleryMap = await loadGalleries([data.id]);
  return rowToProduct(data, galleryMap.get(data.id) || []);
}

// ─── Create ─────────────────────────────────────────────────────────────────
export async function createProduct(input: ProductInput): Promise<Product> {
  const gallery = normalizeGallery(input);

  if (!isSupabaseConfigured()) {
    const newProduct: Product = {
      id: String(Date.now()),
      sku: input.sku,
      name: input.name,
      description: input.description ?? "",
      image: gallery[0]?.url ?? "",
      gallery,
      diamondCaratOptions: [input.selectedCarat],
      selectedCarat: input.selectedCarat,
      goldWt18k: input.goldWt18k,
      goldWt14k: input.goldWt14k,
      diamondWt: input.diamondWt,
      category: input.category,
      silver925: input.silver925,
      price: input.price,
      subCategory: input.subCategory,
      size: input.size,
      gender: input.gender,
      isActive: input.isActive ?? true,
    };
    mockProducts.push(newProduct);
    return newProduct;
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      sku: input.sku.toUpperCase(),
      name: input.name,
      description: input.description ?? "",
      image_path: gallery[0]?.url ?? "",
      default_carat: input.selectedCarat,
      gold_wt_18k: input.goldWt18k,
      gold_wt_14k: input.goldWt14k,
      diamond_wt: input.diamondWt,
      silver_925: input.silver925,
      price: input.price,
      size: input.size,
      category: input.category,
      sub_category: input.subCategory,
      gender: input.gender,
      is_active: input.isActive ?? true,
    })
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || "Insert failed");

  // Save full gallery (always — even if just one image, so the gallery
  // table stays the source of truth for the storefront).
  if (gallery.length > 0) {
    const imageRows = gallery.map((g, i) => ({
      product_id: data.id,
      image_path: g.url,
      is_primary: i === 0,
      sort_order: i,
      color: g.color,
    }));
    const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
    if (imgErr) console.error("Saving gallery failed:", imgErr);
  }

  return rowToProduct(data, gallery);
}

// ─── Update ─────────────────────────────────────────────────────────────────
export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const gallery = normalizeGallery(input);

  if (!isSupabaseConfigured()) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx] = {
      ...mockProducts[idx],
      sku: input.sku,
      name: input.name,
      description: input.description ?? "",
      image: gallery[0]?.url ?? "",
      gallery,
      selectedCarat: input.selectedCarat,
      goldWt18k: input.goldWt18k,
      goldWt14k: input.goldWt14k,
      diamondWt: input.diamondWt,
      silver925: input.silver925,
      price: input.price,
      size: input.size,
      category: input.category,
      subCategory: input.subCategory,
      gender: input.gender,
      isActive: input.isActive ?? true,
    };
    return mockProducts[idx];
  }

  const { data, error } = await supabase
    .from("products")
    .update({
      sku: input.sku.toUpperCase(),
      name: input.name,
      description: input.description ?? "",
      image_path: gallery[0]?.url ?? "",
      default_carat: input.selectedCarat,
      gold_wt_18k: input.goldWt18k,
      gold_wt_14k: input.goldWt14k,
      diamond_wt: input.diamondWt,
      silver_925: input.silver925,
      price: input.price,
      size: input.size,
      category: input.category,
      sub_category: input.subCategory,
      gender: input.gender,
      is_active: input.isActive ?? true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error || !data) throw new Error(error?.message || "Update failed");

  // Replace gallery wholesale: delete all, then re-insert in order.
  // Simple and correct; the gallery is small.
  await supabase.from("product_images").delete().eq("product_id", id);
  if (gallery.length > 0) {
    const imageRows = gallery.map((g, i) => ({
      product_id: id,
      image_path: g.url,
      is_primary: i === 0,
      sort_order: i,
      color: g.color,
    }));
    const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
    if (imgErr) console.error("Saving gallery failed:", imgErr);
  }

  return rowToProduct(data, gallery);
}

// ─── Delete ─────────────────────────────────────────────────────────────────
export async function setProductActive(
  id: string,
  isActive: boolean
): Promise<void> {
  if (!isSupabaseConfigured()) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) mockProducts[idx].isActive = isActive;
    return;
  }
 
  const { error } = await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
 
  if (error) throw new Error(error.message);
}
 
/**
 * Hard-delete a product. Removes the product row and its gallery images.
 * Will fail (and surface an error) if the product is referenced by
 * existing orders — protect order history.
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) mockProducts.splice(idx, 1);
    return;
  }
 
  // Check for order references first so we can give a clean error message
  // instead of a cryptic foreign-key violation.
  const { count: orderRefCount, error: refErr } = await supabase
    .from("order_items")
    .select("id", { count: "exact", head: true })
    .eq("product_id", id);
 
  if (refErr) {
    // If the order_items table doesn't exist or the column is named
    // differently, swallow this — the actual delete will still surface
    // a real error if there's a constraint problem.
    console.warn("Order reference check failed:", refErr.message);
  } else if ((orderRefCount ?? 0) > 0) {
    throw new Error(
      `Can't delete: this product appears in ${orderRefCount} past order${
        orderRefCount === 1 ? "" : "s"
      }. Hide it from the storefront instead.`
    );
  }
 
  // Drop dependent rows first (in case there's no ON DELETE CASCADE).
  await supabase.from("product_images").delete().eq("product_id", id);
  await supabase.from("product_carat_options").delete().eq("product_id", id);
 
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ─── Image upload to Supabase Storage ───────────────────────────────────────
export async function uploadProductImage(
  file: File,
  sku: string,
  index: number = 0
): Promise<string> {
  if (!isSupabaseConfigured()) {
    return URL.createObjectURL(file);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${sku.toUpperCase()}-${Date.now()}-${index}.${ext}`;
  const path = `products/${filename}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Make sure the gallery has at least one image, that gallery[0].url === image,
 * that there are no empty entries or duplicate URLs, and that color values
 * are normalized (lowercased, trimmed, empty → null).
 */
function normalizeGallery(input: ProductInput): GalleryImage[] {
  const raw: GalleryImage[] = (input.gallery && input.gallery.length > 0)
    ? input.gallery.map((g) => ({ url: g.url, color: g.color }))
    : (input.image ? [{ url: input.image, color: null }] : []);

  // If a primary `image` is set but isn't already first in the gallery,
  // hoist it to the front (preserving its color tag if it had one).
  if (input.image && raw[0]?.url !== input.image) {
    const matchIdx = raw.findIndex((g) => g.url === input.image);
    if (matchIdx > 0) {
      const [picked] = raw.splice(matchIdx, 1);
      raw.unshift(picked);
    } else {
      raw.unshift({ url: input.image, color: null });
    }
  }

  const seen = new Set<string>();
  const out: GalleryImage[] = [];
  for (const g of raw) {
    const url = (g.url || "").trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const color = g.color ? g.color.trim().toLowerCase() : null;
    out.push({ url, color: color || null });
  }
  return out;
}

function rowToProduct(row: any, gallery: GalleryImage[] = []): Product {
  const primary = getImageUrl(row.image_path);
  const finalGallery: GalleryImage[] =
    gallery.length > 0 ? gallery : [{ url: primary, color: null }];

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description ?? "",
    image: finalGallery[0]?.url ?? primary,
    gallery: finalGallery,
    diamondCaratOptions: [row.default_carat],
    selectedCarat: row.default_carat,
    goldWt18k: row.gold_wt_18k,
    goldWt14k: row.gold_wt_14k,
    diamondWt: row.diamond_wt,
    category: row.category,
    silver925: row.silver_925,
    price: row.price,
    subCategory: row.sub_category,
    size: row.size,
    gender: row.gender ?? "WOMEN",
    isActive: row.is_active ?? true,
  };
}