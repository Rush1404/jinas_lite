// ─── Landing page data ──────────────────────────────────────────────────────
// Content for the Mejuri-inspired editorial homepage.
// Swap in real product data / CDN images when ready.
// ────────────────────────────────────────────────────────────────────────────

import { routes } from "../utils/router";

export interface LandingCategory {
  num: string;
  label: string;
  image: string;
  href: string;
}

export interface LandingProduct {
  name: string;
  desc: string;
  price: string;
  image: string;
  sku: string;
  badge?: "New" | "Bestseller" | "Limited";
  /** Card layout variant — lets you break the grid editorially */
  variant?: "tall" | "offset" | "default";
}

export const landingCategories: LandingCategory[] = [
  {
    num: "№ 01",
    label: "Rings",
    image:
      "https://images.unsplash.com/photo-1518370265276-f22b706aeac8?q=80",
    href: routes.category("RING"),
  },
  {
    num: "№ 02",
    label: "Earrings",
    image:
      "https://images.unsplash.com/photo-1693213085235-ea6deadf8cee?q=80",
    href: routes.category("EARRING"),
  },
  {
    num: "№ 03",
    label: "Bracelets",
    image:
      "https://images.unsplash.com/photo-1691991054594-c64b364a9fab?q=80",
    href: routes.category("LOOSE_BRACELET"),
  },
  {
    num: "№ 04",
    label: "Pendants",
    image:
      "https://images.unsplash.com/photo-1724937721228-f7bf3df2a4d8?q=80",
    href: routes.category("PENDANT"),
  },
];

// SKUs here correspond to entries in data/products.ts so the product detail
// route can find them.
export const landingProducts: LandingProduct[] = [
  {
    name: "Solitaire Ring",
    desc: "1.00 ct · 18k vermeil",
    price: "$350",
    image:
      "https://images.unsplash.com/photo-1768423685978-42fe24ec39a0?q=80",
    sku: "RG0201",
    badge: "New",
  },
  {
    name: "Diamond Studs",
    desc: "0.50 ct · silver 925",
    price: "$120",
    image:
      "https://images.unsplash.com/photo-1769151591224-2eee6793b885?q=80",
    sku: "ER0101",
  },
  {
    name: "Tennis Bracelet",
    desc: "1.52 ct · 18k vermeil",
    price: "$320",
    image:
      "https://images.unsplash.com/photo-1679156271376-3a69ba96a2dc?q=80",
    sku: "LB0487",
    badge: "Bestseller",
  },
  {
    name: "Three Stone",
    desc: "1.50 ct · gold vermeil",
    price: "$480",
    image:
      "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?w=900&q=80",
    sku: "RG0202",
  },
  {
    name: "Open Cuff",
    desc: "1.08 ct · 14k vermeil",
    price: "$245",
    image:
      "https://images.unsplash.com/photo-1681091638833-b2409f8ee8d8?q=80",
    sku: "LB0484",
  },
  {
    name: "Teardrop Pendant",
    desc: "0.50 ct · silver 925",
    price: "$165",
    image:
      "https://images.unsplash.com/photo-1705326452390-3ecf6070595f?q=80",
    sku: "PD0301",
    badge: "Limited",
  },
];