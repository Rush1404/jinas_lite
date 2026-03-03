#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════════════════════════
// import-products.mjs
//
// Bulk-imports products from a CSV file into Supabase.
// This is how Jina (or an admin) adds new products easily.
//
// CSV FORMAT (products.csv):
//   sku,name,sub_category,category,default_carat,gold_wt_18k,gold_wt_14k,diamond_wt,silver_925,price,size,carat_options
//   LB0484,Eternity Open Cuff Bracelet,LOOSE_BRACELET,ETERNITY_COLLECTION,1.00,5.236,4.4,1.08,3.828,245,1.00,"1.00|1.50|2.00|2.50|3.00"
//   ER0101,Diamond Stud Earrings,EARRING,SINGLE_DIAMOND_COLLECTION,0.50,1.8,1.5,0.50,1.2,120,0.50,"0.25|0.50|0.75|1.00"
//
// USAGE:
//   node scripts/import-products.mjs --file products.csv
//
// PREREQUISITES:
//   npm install @supabase/supabase-js csv-parse
//   Set SUPABASE_URL and SUPABASE_SERVICE_KEY in your environment.
//   (Use the SERVICE key, not the anon key — this script needs write access.)
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";
import { parse } from "csv-parse/sync";
import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("ERROR: Set SUPABASE_URL and SUPABASE_SERVICE_KEY env vars.");
  console.error("  The SERVICE key (not anon) is required for write access.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Parse CLI args ──────────────────────────────────────────────────────────

const fileArg = process.argv.find((a) => a.startsWith("--file="));
const filePath = fileArg
  ? resolve(fileArg.split("=")[1])
  : resolve("products.csv");

console.log(`Reading: ${filePath}\n`);

// ─── Read & parse CSV ────────────────────────────────────────────────────────

const csv = readFileSync(filePath, "utf-8");
const rows = parse(csv, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
});

console.log(`Found ${rows.length} products to import.\n`);

// ─── Import ──────────────────────────────────────────────────────────────────

let imported = 0;
let skipped = 0;
let failed = 0;

for (const row of rows) {
  const sku = row.sku?.trim();
  if (!sku) {
    console.warn("  SKIP: Row with empty SKU");
    skipped++;
    continue;
  }

  // image_path follows the convention: products/{SKU}.webp
  const imagePath = `products/${sku.toUpperCase()}.webp`;

  const product = {
    sku,
    name: row.name,
    image_path: imagePath,
    sub_category: row.sub_category,
    category: row.category,
    default_carat: parseFloat(row.default_carat) || 1.0,
    gold_wt_18k: parseFloat(row.gold_wt_18k) || 0,
    gold_wt_14k: parseFloat(row.gold_wt_14k) || 0,
    diamond_wt: parseFloat(row.diamond_wt) || 0,
    silver_925: parseFloat(row.silver_925) || 0,
    price: parseFloat(row.price) || 0,
    size: parseFloat(row.size) || 0,
  };

  // Upsert product (update if SKU already exists)
  const { data, error } = await supabase
    .from("products")
    .upsert(product, { onConflict: "sku" })
    .select("id")
    .single();

  if (error) {
    console.error(`  FAIL: ${sku} — ${error.message}`);
    failed++;
    continue;
  }

  const productId = data.id;

  // Parse carat options (pipe-separated: "1.00|1.50|2.00")
  const caratStr = row.carat_options || row.default_carat;
  const carats = caratStr
    .split("|")
    .map((c) => parseFloat(c.trim()))
    .filter((c) => !isNaN(c));

  if (carats.length > 0) {
    // Delete existing carat options for this product, then re-insert
    await supabase
      .from("product_carat_options")
      .delete()
      .eq("product_id", productId);

    const caratRows = carats.map((c) => ({
      product_id: productId,
      carat_value: c,
    }));

    const { error: caratError } = await supabase
      .from("product_carat_options")
      .insert(caratRows);

    if (caratError) {
      console.warn(`  WARN: ${sku} — carat options failed: ${caratError.message}`);
    }
  }

  console.log(`  OK: ${sku} — ${product.name}`);
  imported++;
}

console.log(`\nDone. Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`);
