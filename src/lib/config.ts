// ─── Environment Configuration ───────────────────────────────────────────────
// Copy .env.example to .env and fill in your values.
// Vite exposes these as import.meta.env.VITE_*
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  /**
   * Supabase — stores all product METADATA (specs, prices, categories).
   * The free tier (500MB) handles tens of thousands of products.
   */
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL as string || "",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY as string || "",
  },

  /**
   * Cloudflare R2 — serves all product IMAGES via global CDN.
   *
   * Your WD My Cloud Home syncs images to R2 via a cron script.
   * R2 free tier: 10GB storage, unlimited bandwidth, zero egress fees.
   * Even beyond 10GB it's only ~$0.015/GB/month.
   *
   * Image URL pattern:  {baseUrl}/{sku}.webp
   * e.g. https://media.jinaslite.com/products/LB0484.webp
   */
  images: {
    baseUrl: import.meta.env.VITE_IMAGE_BASE_URL as string || "",
    fallback: "/placeholder-jewelry.svg",
  },

  /** Products loaded per page (Supabase handles OFFSET/LIMIT natively) */
  productsPerPage: 24,
} as const;