// ─── Environment Configuration ───────────────────────────────────────────────
// Copy .env.example to .env and fill in your values.
// Vite exposes these as import.meta.env.VITE_*
// ─────────────────────────────────────────────────────────────────────────────

export const config = {
  /**
   * Supabase — stores all product METADATA (specs, prices, categories),
   * user accounts, and orders.
   */
  supabase: {
    url: (import.meta.env.VITE_SUPABASE_URL as string) || "",
    anonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || "",
  },

  /**
   * Cloudflare R2 — serves all product IMAGES via global CDN.
   * Image URL pattern:  {baseUrl}/{sku}.webp
   */
  images: {
    baseUrl: (import.meta.env.VITE_IMAGE_BASE_URL as string) || "",
    fallback: "/placeholder-jewelry.svg",
  },

  /**
   * Admin portal password gate.
   * This is a SOFT password (client-side only) — fine for a dev/preview
   * environment. The real security is Supabase RLS: even with this password,
   * the database only allows writes from users in the `admins` table.
   * Set via VITE_ADMIN_PASSWORD in .env, falls back to 'jina2026' for dev.
   */
  admin: {
    password: (import.meta.env.VITE_ADMIN_PASSWORD as string) || "jina2026",
  },

  /**
   * Stripe — payment processing.
   * In dev (no key set) we use a MOCK checkout flow that simulates success.
   * In prod, set VITE_STRIPE_PUBLISHABLE_KEY and deploy the Edge Function
   * referenced in /supabase/functions/create-payment-intent.
   */
  stripe: {
    publishableKey: (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string) || "",
    // True when no Stripe key is configured — checkout uses mock flow.
    get isMock() {
      return !this.publishableKey;
    },
  },

  /** Products loaded per page (Supabase handles OFFSET/LIMIT natively) */
  productsPerPage: 24,

  /** Default tax rate applied at checkout (13% Ontario HST as a starter) */
  taxRate: 0.13,

  /** Flat shipping cost in cents */
  shippingFlatCents: 1500,
} as const;