// ─── Admin Service ──────────────────────────────────────────────────────────
// All product CRUD called from the admin portal. Uses Supabase when
// configured; falls back to in-memory mutation of mockProducts in dev so the
// portal is usable before Supabase is hooked up.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";
import { config } from "../lib/config";
import { mockProducts } from "../data/products";
import { getImageUrl } from "../utils/images";
import type { Product, SubCategory, Category, Gender } from "../types/product";

export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  image: string;        // primary image URL (kept in sync with images[0])
  images?: string[];    // gallery URLs (first is primary)
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
async function loadGalleries(productIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (productIds.length === 0) return map;

  const { data, error } = await supabase
    .from("product_images")
    .select("product_id, image_path, is_primary, sort_order")
    .in("product_id", productIds)
    .order("is_primary", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("loadGalleries:", error);
    return map;
  }

  data?.forEach((r: any) => {
    const existing = map.get(r.product_id) ?? [];
    existing.push(getImageUrl(r.image_path));
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
  // Normalize images: ensure images[0] === image
  const images = normalizeImages(input);

  if (!isSupabaseConfigured()) {
    const newProduct: Product = {
      id: String(Date.now()),
      sku: input.sku,
      name: input.name,
      description: input.description ?? "",
      image: images[0],
      images,
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
      image_path: images[0],
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
  if (images.length > 0) {
    const imageRows = images.map((url, i) => ({
      product_id: data.id,
      image_path: url,
      is_primary: i === 0,
      sort_order: i,
    }));
    const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
    if (imgErr) console.error("Saving gallery failed:", imgErr);
  }

  return rowToProduct(data, images);
}

// ─── Update ─────────────────────────────────────────────────────────────────
export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  const images = normalizeImages(input);

  if (!isSupabaseConfigured()) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx] = {
      ...mockProducts[idx],
      sku: input.sku,
      name: input.name,
      description: input.description ?? "",
      image: images[0],
      images,
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
      image_path: images[0],
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
  if (images.length > 0) {
    const imageRows = images.map((url, i) => ({
      product_id: id,
      image_path: url,
      is_primary: i === 0,
      sort_order: i,
    }));
    const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
    if (imgErr) console.error("Saving gallery failed:", imgErr);
  }

  return rowToProduct(data, images);
}

// ─── Delete ─────────────────────────────────────────────────────────────────
// Soft delete (sets is_active=false) so we don't break old order references.
export async function deleteProduct(id: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx !== -1) mockProducts.splice(idx, 1);
    return;
  }

  const { error } = await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
}

// ─── Image upload to Supabase Storage ───────────────────────────────────────
//
// Returns the public URL of the uploaded file. The `index` parameter
// disambiguates filenames when uploading multiple images for the same SKU
// in quick succession (Date.now() alone can collide).
// ─────────────────────────────────────────────────────────────────────────────
export async function uploadProductImage(
  file: File,
  sku: string,
  index: number = 0
): Promise<string> {
  if (!isSupabaseConfigured()) {
    // Dev-mode: create a local object URL so the preview works.
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
 * Make sure we always have at least one image, that images[0] === image,
 * and that there are no empty entries or duplicates.
 */
function normalizeImages(input: ProductInput): string[] {
  const raw = (input.images && input.images.length > 0)
    ? [...input.images]
    : (input.image ? [input.image] : []);

  // If a primary `image` is set but isn't already first in the gallery,
  // hoist it to the front.
  if (input.image && raw[0] !== input.image) {
    const without = raw.filter((u) => u !== input.image);
    raw.length = 0;
    raw.push(input.image, ...without);
  }

  // Drop empties and dedupe while preserving order.
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of raw) {
    const trimmed = (url || "").trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

function rowToProduct(row: any, gallery: string[] = []): Product {
  const primary = getImageUrl(row.image_path);
  const images = gallery.length > 0 ? gallery : [primary];

  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description ?? "",
    image: images[0] ?? primary,
    images,
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