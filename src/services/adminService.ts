// ─── Admin Service ──────────────────────────────────────────────────────────
// All product CRUD called from the admin portal. Uses Supabase when
// configured; falls back to in-memory mutation of mockProducts in dev so the
// portal is usable before Supabase is hooked up.
// ────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabase";
import { config } from "../lib/config";
import { mockProducts } from "../data/products";
import type { Product, SubCategory, Category, Gender } from "../types/product";

export interface ProductInput {
  sku: string;
  name: string;
  description?: string;
  image: string;        // primary image URL
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

  return (data ?? []).map(rowToProduct);
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
  return rowToProduct(data);
}

// ─── Create ─────────────────────────────────────────────────────────────────
export async function createProduct(input: ProductInput): Promise<Product> {
  if (!isSupabaseConfigured()) {
    const newProduct: Product = {
      id: String(Date.now()),
      sku: input.sku,
      name: input.name,
      description: input.description ?? "",
      image: input.image,
      images: input.images ?? [input.image],
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
      image_path: input.image,
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

  // Save gallery images if any
  if (input.images && input.images.length > 0) {
    const imageRows = input.images.map((url, i) => ({
      product_id: data.id,
      image_path: url,
      is_primary: i === 0,
      sort_order: i,
    }));
    await supabase.from("product_images").insert(imageRows);
  }

  return rowToProduct(data);
}

// ─── Update ─────────────────────────────────────────────────────────────────
export async function updateProduct(id: string, input: ProductInput): Promise<Product> {
  if (!isSupabaseConfigured()) {
    const idx = mockProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Product not found");
    mockProducts[idx] = {
      ...mockProducts[idx],
      sku: input.sku,
      name: input.name,
      description: input.description ?? "",
      image: input.image,
      images: input.images ?? [input.image],
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
      image_path: input.image,
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

  // Replace gallery
  if (input.images) {
    await supabase.from("product_images").delete().eq("product_id", id);
    if (input.images.length > 0) {
      const imageRows = input.images.map((url, i) => ({
        product_id: id,
        image_path: url,
        is_primary: i === 0,
        sort_order: i,
      }));
      await supabase.from("product_images").insert(imageRows);
    }
  }

  return rowToProduct(data);
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
export async function uploadProductImage(file: File, sku: string): Promise<string> {
  if (!isSupabaseConfigured()) {
    // Dev-mode: create a local object URL so the preview works.
    return URL.createObjectURL(file);
  }

  const ext = file.name.split(".").pop() || "jpg";
  const filename = `${sku.toUpperCase()}-${Date.now()}.${ext}`;
  const path = `products/${filename}`;

  const { error } = await supabase.storage
    .from("product-images")
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from("product-images").getPublicUrl(path);
  return data.publicUrl;
}

// ─── Helpers ────────────────────────────────────────────────────────────────
function rowToProduct(row: any): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    description: row.description ?? "",
    image: row.image_path,
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