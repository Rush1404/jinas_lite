// ─── Router ─────────────────────────────────────────────────────────────────
// Tiny typed hash router. All routes live under `#/...`.
// Supports:
//   #/                      → landing
//   #/jewelry               → all jewelry (full catalog)
//   #/rings                 → rings category
//   #/earrings              → earrings category
//   #/bracelets             → bracelets category
//   #/pendants              → pendants category
//   #/mens                  → men's collection
//   #/product/{sku}         → individual product page
//   #/cart                  → shopping cart
//   #/checkout              → checkout flow
//   #/login                 → sign in / sign up
//   #/account               → user account (orders, sign out)
//   #/admin                 → admin portal (password-protected)
//
// NOTE: /shop has been removed. Any old #/shop link is treated as landing.
// ────────────────────────────────────────────────────────────────────────────

import type { SubCategory, Gender } from "../types/product";

export type Route =
  | { kind: "landing" }
  | { kind: "all" }
  | { kind: "category"; subCategory: SubCategory }
  | { kind: "gender"; gender: Gender }
  | { kind: "product"; sku: string }
  | { kind: "cart" }
  | { kind: "checkout" }
  | { kind: "order-success"; orderId: string }
  | { kind: "login" }
  | { kind: "account" }
  | { kind: "admin"; section?: "list" | "edit" | "new"; sku?: string };

const CATEGORY_SLUGS: Record<string, SubCategory> = {
  rings: "RING",
  earrings: "EARRING",
  bracelets: "LOOSE_BRACELET",
  pendants: "PENDANT",
};

const GENDER_SLUGS: Record<string, Gender> = {
  mens: "MEN",
  womens: "WOMEN",
};

export function parseRoute(): Route {
  const hash = window.location.hash.replace(/^#/, "") || "/";
  const parts = hash.split("/").filter(Boolean);

  if (parts.length === 0) return { kind: "landing" };

  const [first, second, third] = parts;

  // Cart / checkout / auth / account
  if (first === "cart") return { kind: "cart" };
  if (first === "checkout") return { kind: "checkout" };
  if (first === "order-success" && second) {
    return { kind: "order-success", orderId: decodeURIComponent(second) };
  }
  if (first === "login") return { kind: "login" };
  if (first === "account") return { kind: "account" };
  if (first === "jewelry") return { kind: "all" };

  // Admin
  if (first === "admin") {
    if (second === "new") return { kind: "admin", section: "new" };
    if (second === "edit" && third) {
      return { kind: "admin", section: "edit", sku: decodeURIComponent(third).toUpperCase() };
    }
    return { kind: "admin", section: "list" };
  }

  // Product
  if (first === "product" && second) {
    return { kind: "product", sku: decodeURIComponent(second).toUpperCase() };
  }

  // Gender
  if (first in GENDER_SLUGS) {
    return { kind: "gender", gender: GENDER_SLUGS[first] };
  }

  // Sub-category
  if (first in CATEGORY_SLUGS) {
    return { kind: "category", subCategory: CATEGORY_SLUGS[first] };
  }

  // Anything unknown (including a stale #/shop) → landing
  return { kind: "landing" };
}

// ─── URL builders ───────────────────────────────────────────────────────────
export const routes = {
  landing: () => "#/",
  all: () => "#/jewelry",
  category: (sub: SubCategory) => {
    const entry = Object.entries(CATEGORY_SLUGS).find(([, v]) => v === sub);
    return entry ? `#/${entry[0]}` : "#/";
  },
  gender: (g: Gender) => {
    const entry = Object.entries(GENDER_SLUGS).find(([, v]) => v === g);
    return entry ? `#/${entry[0]}` : "#/";
  },
  product: (sku: string) => `#/product/${encodeURIComponent(sku.toLowerCase())}`,
  cart: () => "#/cart",
  checkout: () => "#/checkout",
  orderSuccess: (orderId: string) => `#/order-success/${encodeURIComponent(orderId)}`,
  login: () => "#/login",
  account: () => "#/account",
  admin: () => "#/admin",
  adminNew: () => "#/admin/new",
  adminEdit: (sku: string) => `#/admin/edit/${encodeURIComponent(sku.toLowerCase())}`,
};

// ─── Subscribe to route changes ─────────────────────────────────────────────
export function onRouteChange(callback: (route: Route) => void): () => void {
  const handler = () => callback(parseRoute());
  window.addEventListener("hashchange", handler);
  return () => window.removeEventListener("hashchange", handler);
}

// ─── Navigate programmatically ──────────────────────────────────────────────
export function navigate(hash: string) {
  window.location.hash = hash.replace(/^#/, "");
}

// ─── Pretty labels ──────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<SubCategory, string> = {
  RING: "Rings",
  EARRING: "Earrings",
  LOOSE_BRACELET: "Bracelets",
  PENDANT: "Pendants",
  ALL: "All Jewelry",
};

const GENDER_LABELS: Record<Gender, string> = {
  WOMEN: "Women",
  MEN: "Men",
  UNISEX: "Unisex",
};

export function categoryLabel(sub: SubCategory): string {
  return CATEGORY_LABELS[sub];
}

export function genderLabel(g: Gender): string {
  return GENDER_LABELS[g];
}