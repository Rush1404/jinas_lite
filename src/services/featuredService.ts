// ─── Featured Products Service ──────────────────────────────────────────────
// Stores the SKUs Jina picks to showcase in the landing page's
// "The edit, picked by Jina" section.
//
// Persistence:
//   - We store SKUs only (never names/images/prices) so the storefront
//     always reflects the live catalog. If a featured product is later
//     edited, renamed, or repriced in the admin, the landing page picks
//     up the change automatically.
//
//   - Storage backend is localStorage. It survives reloads and is
//     adequate for a single-admin workflow (Jina manages the site from
//     her own browser). If/when the picks need to follow Jina across
//     devices, swap the read/write fns for a Supabase round-trip — see
//     the `// TODO(supabase)` markers below.
//
//   - A small in-memory cache mirrors the storage so the landing page
//     can render synchronously without an `await`.
// ────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY = "jinas-lite:featured-skus";
export const MAX_FEATURED = 6;

let cache: string[] | null = null;

/**
 * Read the current list of featured SKUs (in display order).
 * Returns at most MAX_FEATURED entries; over-long stored lists are
 * silently truncated.
 */
export function getFeaturedSkus(): string[] {
  if (cache) return cache.slice();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = [];
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      cache = [];
      return [];
    }
    cache = parsed
      .filter((s): s is string => typeof s === "string")
      .slice(0, MAX_FEATURED);
    return cache.slice();
  } catch (err) {
    console.warn("Failed to read featured SKUs from storage:", err);
    cache = [];
    return [];
  }

  // TODO(supabase): when ready, fetch from a `site_settings` row keyed
  // by 'featured_skus' and hydrate `cache` here. Keep localStorage as a
  // synchronous fallback for first paint.
}

/**
 * Persist the new list. Order is significant — it determines the order
 * pieces appear in the landing-page edit. Excess SKUs beyond
 * MAX_FEATURED are dropped.
 */
export function setFeaturedSkus(skus: string[]): void {
  const trimmed = skus.slice(0, MAX_FEATURED);
  cache = trimmed;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (err) {
    console.warn("Failed to persist featured SKUs:", err);
  }

  // TODO(supabase): also write to site_settings here so other admin
  // sessions / devices see the change.
}

/**
 * Add a SKU to the end of the list (no-op if already present or list
 * is full). Returns the new list.
 */
export function addFeaturedSku(sku: string): string[] {
  const current = getFeaturedSkus();
  if (current.includes(sku)) return current;
  if (current.length >= MAX_FEATURED) return current;
  const next = [...current, sku];
  setFeaturedSkus(next);
  return next;
}

/**
 * Remove a SKU from the list. Returns the new list.
 */
export function removeFeaturedSku(sku: string): string[] {
  const current = getFeaturedSkus();
  const next = current.filter((s) => s !== sku);
  setFeaturedSkus(next);
  return next;
}

/**
 * Move a SKU from `fromIndex` to `toIndex` (clamped). Returns the new
 * list. No-op when indices are equal or out of range.
 */
export function reorderFeaturedSkus(
  fromIndex: number,
  toIndex: number
): string[] {
  const current = getFeaturedSkus();
  if (
    fromIndex < 0 ||
    fromIndex >= current.length ||
    toIndex < 0 ||
    toIndex >= current.length ||
    fromIndex === toIndex
  ) {
    return current;
  }
  const next = current.slice();
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  setFeaturedSkus(next);
  return next;
}