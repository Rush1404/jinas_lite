// ─── Router ─────────────────────────────────────────────────────────────────
// Tiny typed hash router. All routes live under `#/...`.
// Supports:
//   #/                   → landing
//   #/shop               → full catalog
//   #/rings              → rings category
//   #/earrings           → earrings category
//   #/bracelets          → bracelets category
//   #/pendants           → pendants category
//   #/product/{sku}      → individual product page
// ────────────────────────────────────────────────────────────────────────────

import type { SubCategory } from "../types/product";

export type Route =
  | { kind: "landing" }
  | { kind: "shop" }
  | { kind: "category"; subCategory: SubCategory }
  | { kind: "product"; sku: string };

const CATEGORY_SLUGS: Record<string, SubCategory> = {
  rings: "RING",
  earrings: "EARRING",
  bracelets: "LOOSE_BRACELET",
  pendants: "PENDANT",
};

export function parseRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0) return { kind: "landing" };

  const [first, second] = parts;

  if (first === "shop") return { kind: "shop" };

  if (first === "product" && second) {
    return { kind: "product", sku: decodeURIComponent(second).toUpperCase() };
  }

  if (first in CATEGORY_SLUGS) {
    return { kind: "category", subCategory: CATEGORY_SLUGS[first] };
  }

  return { kind: "landing" };
}

// ─── URL builders — use these when rendering links, never hand-write hashes ─
export const routes = {
  landing: () => "#/",
  shop: () => "#/shop",
  category: (sub: SubCategory) => {
    const entry = Object.entries(CATEGORY_SLUGS).find(([, v]) => v === sub);
    return entry ? `#/${entry[0]}` : "#/shop";
  },
  product: (sku: string) => `#/product/${encodeURIComponent(sku.toLowerCase())}`,
};

// ─── Subscribe to route changes ─────────────────────────────────────────────
export function onRouteChange(callback: (route: Route) => void): () => void {
  const handler = () => callback(parseRoute());
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}

// ─── Navigate programmatically (also works for plain href=#/...) ────────────
export function navigate(hash: string) {
  window.location.hash = hash.replace(/^#/, "");
}

// ─── Pretty label for category (for page titles, breadcrumbs) ───────────────
const CATEGORY_LABELS: Record<SubCategory, string> = {
  RING: "Rings",
  EARRING: "Earrings",
  LOOSE_BRACELET: "Bracelets",
  PENDANT: "Pendants",
  ALL: "All Jewelry",
};

export function categoryLabel(sub: SubCategory): string {
  return CATEGORY_LABELS[sub];
}