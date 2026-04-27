-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 002: Admin portal + Cart + Auth support
--
-- Adds:
--   1. `gender` column to products  → enables "Men's" landing section
--   2. `product_images` table       → multiple images per product (gallery + primary)
--   3. `description` column         → editable long-form copy
--   4. `is_active` column           → soft-delete (instead of hard delete)
--   5. `orders` + `order_items`     → checkout / purchase records
--   6. `admins` table               → simple allow-list of admin user IDs
--   7. Storage bucket policies      → product image uploads from the admin portal
--
-- Run AFTER 001_create_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Extend products table ──────────────────────────────────────────────
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS gender TEXT
    CHECK (gender IN ('WOMEN', 'MEN', 'UNISEX')) DEFAULT 'WOMEN',
  ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);

-- ── 2. Multiple images per product ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS product_images (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_path  TEXT NOT NULL,
  is_primary  BOOLEAN DEFAULT FALSE,
  sort_order  INT DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_product_images_one_primary
  ON product_images(product_id) WHERE is_primary = TRUE;

-- ── 3. Orders + line items ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email           TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'shipped', 'fulfilled', 'cancelled', 'refunded')),
  subtotal_cents  INT NOT NULL,
  tax_cents       INT NOT NULL DEFAULT 0,
  shipping_cents  INT NOT NULL DEFAULT 0,
  total_cents     INT NOT NULL,
  currency        TEXT NOT NULL DEFAULT 'USD',
  shipping_name   TEXT,
  shipping_addr1  TEXT,
  shipping_addr2  TEXT,
  shipping_city   TEXT,
  shipping_region TEXT,
  shipping_postal TEXT,
  shipping_country TEXT,
  payment_intent_id TEXT,    -- Stripe PaymentIntent id (or mock id in dev)
  payment_method  TEXT DEFAULT 'mock',  -- 'mock' in dev, 'stripe' in prod
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  sku          TEXT NOT NULL,           -- snapshot, in case product is later deleted
  name         TEXT NOT NULL,
  unit_price_cents INT NOT NULL,
  quantity     INT NOT NULL CHECK (quantity > 0),
  image_path   TEXT
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- ── 4. Admin allow-list ───────────────────────────────────────────────────
-- A simple list of users with admin rights. Add Jina's user id here after
-- she signs up.
CREATE TABLE IF NOT EXISTS admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Helper function: is the current user an admin?
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
$$;

-- ── 5. Row Level Security ─────────────────────────────────────────────────
-- Public read on products & images, admin-only write.

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_carat_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Drop old policies if re-running
DROP POLICY IF EXISTS "Public can read active products" ON products;
DROP POLICY IF EXISTS "Admins can write products" ON products;
DROP POLICY IF EXISTS "Public can read carat options" ON product_carat_options;
DROP POLICY IF EXISTS "Admins can write carat options" ON product_carat_options;
DROP POLICY IF EXISTS "Public can read images" ON product_images;
DROP POLICY IF EXISTS "Admins can write images" ON product_images;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Anyone can insert orders" ON orders;
DROP POLICY IF EXISTS "Admins can read all orders" ON orders;
DROP POLICY IF EXISTS "Users can read own order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can insert order items" ON order_items;
DROP POLICY IF EXISTS "Admins can read all order items" ON order_items;
DROP POLICY IF EXISTS "Admins can read admin list" ON admins;

-- Products: anyone reads active, admins do everything
CREATE POLICY "Public can read active products" ON products
  FOR SELECT USING (is_active = TRUE OR is_admin());
CREATE POLICY "Admins can write products" ON products
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can read carat options" ON product_carat_options
  FOR SELECT USING (TRUE);
CREATE POLICY "Admins can write carat options" ON product_carat_options
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Public can read images" ON product_images
  FOR SELECT USING (TRUE);
CREATE POLICY "Admins can write images" ON product_images
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Orders: signed-in users see their own, admins see all,
-- anyone can create (guest checkout)
CREATE POLICY "Users can read own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id OR is_admin());
CREATE POLICY "Anyone can insert orders" ON orders
  FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (is_admin());

CREATE POLICY "Users can read own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND (orders.user_id = auth.uid() OR is_admin())
    )
  );
CREATE POLICY "Anyone can insert order items" ON order_items
  FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "Admins can read admin list" ON admins
  FOR SELECT USING (is_admin());

-- ── 6. Storage bucket for product images ──────────────────────────────────
-- Run these in Supabase Studio → Storage if not already done:
--   1. Create a public bucket called `product-images`
--   2. The policies below allow admins to upload/delete, public to read.

INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update product images" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete product images" ON storage.objects;

CREATE POLICY "Public can view product images" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can update product images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'product-images' AND is_admin());

CREATE POLICY "Admins can delete product images" ON storage.objects
  FOR DELETE USING (bucket_id = 'product-images' AND is_admin());