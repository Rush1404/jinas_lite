// ─── Landing data ───────────────────────────────────────────────────────────
// Static config powering the landing-page category tiles.
//
// Note: the "Featured products" picks (used to live here as
// `landingProducts`) have moved to a real, admin-managed list — see
// `services/featuredService.ts`. The landing page resolves picks
// against the live catalog at render time, so there's no static
// product data to maintain in this file anymore.
// ────────────────────────────────────────────────────────────────────────────

import { routes } from "../utils/router";

export interface LandingCategory {
  num: string;
  label: string;
  image: string;
  href: string;
}

// ─── Shop by category (subcategory tiles) ────────────────────────────────────
// Men sits as the fifth tile alongside the four sub-category tiles, so the
// landing page no longer needs a separate gender strip.
export const landingCategories: LandingCategory[] = [
  {
    num: "№ 01",
    label: "Rings",
    image: "https://images.unsplash.com/photo-1518370265276-f22b706aeac8?q=80",
    href: routes.category("RING"),
  },
  {
    num: "№ 02",
    label: "Earrings",
    image: "https://images.unsplash.com/photo-1693213085235-ea6deadf8cee?q=80",
    href: routes.category("EARRING"),
  },
  {
    num: "№ 03",
    label: "Bracelets",
    image: "https://images.unsplash.com/photo-1691991054594-c64b364a9fab?q=80",
    href: routes.category("LOOSE_BRACELET"),
  },
  {
    num: "№ 04",
    label: "Pendants",
    image: "https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?q=80",
    href: routes.category("PENDANT"),
  },
  {
    num: "№ 05",
    label: "Men",
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80",
    href: routes.gender("MEN"),
  },
];

// ─── Shop by gender ─────────────────────────────────────────────────────────
// (Deprecated for the landing page — Men now lives inside `landingCategories`.
//  Kept exported so the now-unused GenderStrip component still type-checks.
//  Safe to delete this export and `src/components/landing/GenderStrip.ts`
//  together if you want to clean up.)
export const landingGenderCategories: LandingCategory[] = [
  {
    num: "№ 01",
    label: "Women",
    image: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=1200&q=80",
    href: routes.gender("WOMEN"),
  },
  {
    num: "№ 02",
    label: "Men",
    image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=1200&q=80",
    href: routes.gender("MEN"),
  },
];