// ─── Category Page ──────────────────────────────────────────────────────────
// Shows a grid of products filtered by EITHER:
//   - sub-category (Rings, Earrings, Bracelets, Pendants), or
//   - gender (Women, Men, Unisex)
//
// Visual language matches the editorial landing page.
// ────────────────────────────────────────────────────────────────────────────

import { type Product, type SubCategory, type Gender, availableColors } from "../../types/product";
import { formatCurrency } from "../../utils/filters";
import { routes, categoryLabel, genderLabel } from "../../utils/router";
import { cartStore } from "../../lib/cartStore.ts";
import { productToCartItem } from "../../types/cart.ts";

interface PromoTile {
  headline: string;
  sublabel: string;
  cta: string;
  href: string;
  accent: "gold" | "moss" | "bone";
}

const PROMO_BY_CATEGORY: Record<SubCategory, PromoTile> = {
  RING: {
    headline: "Stack them up.",
    sublabel: "Three rings, one hand.",
    cta: "Shop rings",
    href: routes.category("RING"),
    accent: "gold",
  },
  EARRING: {
    headline: "Daily wear.",
    sublabel: "Studs to statements.",
    cta: "Shop earrings",
    href: routes.category("EARRING"),
    accent: "gold",
  },
  LOOSE_BRACELET: {
    headline: "The Eternity edit.",
    sublabel: "Made to layer.",
    cta: "Explore",
    href: routes.category("LOOSE_BRACELET"),
    accent: "moss",
  },
  PENDANT: {
    headline: "Daily delicates.",
    sublabel: "Worn forever.",
    cta: "Shop pendants",
    href: routes.category("PENDANT"),
    accent: "bone",
  },
  ALL: {
    headline: "View everything.",
    sublabel: "One hundred pieces.",
    cta: "Shop all",
    href: routes.landing(),
    accent: "gold",
  },
};

const PROMO_BY_GENDER: Record<Gender, PromoTile> = {
  WOMEN: {
    headline: "Built to layer.",
    sublabel: "Lab-grown diamond, designed for daily.",
    cta: "Explore",
    href: routes.gender("WOMEN"),
    accent: "gold",
  },
  MEN: {
    headline: "Quiet weight.",
    sublabel: "Solid pieces, no logos.",
    cta: "Explore",
    href: routes.gender("MEN"),
    accent: "moss",
  },
  UNISEX: {
    headline: "For everyone.",
    sublabel: "Genderless by design.",
    cta: "Explore",
    href: routes.gender("UNISEX"),
    accent: "bone",
  },
};

// ─── Card swatches (derived from gallery color tags) ────────────────────────

// Map a color tag (e.g. "rose gold") to the CSS swatch class used on cards.
function cardSwatchClass(color: string): string {
  const slug = color.toLowerCase().replace(/\s+/g, "-");
  switch (slug) {
    case "gold":
    case "yellow-gold":
      return "swatch-gold";
    case "gold-deep":
      return "swatch-gold-deep";
    case "silver":
    case "white-gold":
      return "swatch-silver";
    case "rose-gold":
      return "swatch-rose-gold";
    default:
      return "swatch-" + slug;
  }
}

// Pretty label for the swatch's tooltip ("rose gold" → "Rose Gold").
function cardSwatchLabel(color: string): string {
  return color
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Builds the swatch row HTML using plain string concatenation so the
// main renderCard template literal stays flat (no nested backticks).
function renderCardSwatches(colors: string[]): string {
  if (colors.length === 0) {
    // Empty span keeps space-between layout intact so SKU stays right-aligned.
    return '<span></span>';
  }
  const dots = colors
    .map(
      (c) =>
        '<span class="swatch ' +
        cardSwatchClass(c) +
        '" title="' +
        cardSwatchLabel(c) +
        '"></span>'
    )
    .join("");
  return '<div class="cat-swatches" aria-label="Available colors">' + dots + '</div>';
}

// ─── Product Card ───────────────────────────────────────────────────────────
function renderCard(product: Product): string {
  const colors = product.gallery ? availableColors(product.gallery) : [];
  const swatchesHtml = renderCardSwatches(colors);

  return `
    <a
      href="${routes.product(product.sku)}"
      class="cat-product-card"
      data-reveal
      data-product-cursor
      data-sku="${product.sku}"
    >
      <div class="cat-product-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
        <button class="cat-add-btn" aria-label="Add ${product.name} to bag" data-quick-add="${product.sku}">
          <span>Add</span>
          <span class="cat-add-plus">+</span>
        </button>
      </div>
      <div class="cat-product-info">
        <div class="cat-product-title-row">
          <h3 class="cat-product-name">${product.name}</h3>
          <span class="cat-product-price">${formatCurrency(product.price)}</span>
        </div>
        <div class="cat-product-meta">
          ${swatchesHtml}
          <span class="cat-product-sku">${product.sku}</span>
        </div>
      </div>
    </a>
  `;
}

function renderFilterBar(productCount: number): string {
  return `
    <div class="cat-filter-bar">
      <div class="cat-filter-options">
        <button class="cat-filter-trigger" data-filter="material">Material</button>
        <button class="cat-filter-trigger" data-filter="stone">Stone</button>
        <button class="cat-filter-trigger" data-filter="carat">Carat</button>
        <button class="cat-filter-trigger cat-filter-all" data-filter="all">All Filters</button>
      </div>
      <div class="cat-filter-meta">
        <span class="cat-product-count">(${productCount} ${productCount === 1 ? "Piece" : "Pieces"})</span>
        <button class="cat-sort-trigger" data-sort>Sort</button>
      </div>
    </div>
  `;
}

// ─── Render: by subcategory ─────────────────────────────────────────────────
export function renderCategoryPage(
  subCategory: SubCategory,
  products: Product[]
): string {
  const filtered = products.filter(
    (p) => p.subCategory === subCategory && p.isActive !== false
  );
  const promo = PROMO_BY_CATEGORY[subCategory];

  return renderGrid({
    title: categoryLabel(subCategory),
    breadcrumbCurrent: categoryLabel(subCategory),
    products: filtered,
    promo,
  });
}

// ─── Render: by gender ──────────────────────────────────────────────────────
export function renderGenderPage(
  gender: Gender,
  products: Product[]
): string {
  const filtered = products.filter(
    (p) => (p.gender ?? "WOMEN") === gender && p.isActive !== false
  );
  const promo = PROMO_BY_GENDER[gender];

  return renderGrid({
    title: genderLabel(gender),
    breadcrumbCurrent: genderLabel(gender),
    products: filtered,
    promo,
  });
}

// ─── Render: all jewelry ────────────────────────────────────────────────────
export function renderAllJewelryPage(products: Product[]): string {
  const filtered = products.filter((p) => p.isActive !== false);

  return renderGrid({
    title: "All Jewelry",
    breadcrumbCurrent: "All Jewelry",
    products: filtered,
    promo: PROMO_BY_CATEGORY.ALL,
  });
}


// ─── Shared grid rendering ──────────────────────────────────────────────────
function renderGrid(opts: {
  title: string;
  breadcrumbCurrent: string;
  products: Product[];
  promo: PromoTile;
}): string {
  const { title, breadcrumbCurrent, products, promo } = opts;

  const itemsHtml: string[] = [];
  products.forEach((p, i) => {
    itemsHtml.push(renderCard(p));
  });

  return `
    <section class="category-page">
      <header class="cat-page-header">
        <nav class="cat-breadcrumb" aria-label="Breadcrumb">
          <a href="${routes.landing()}">Home</a>
          <span class="cat-breadcrumb-sep">/</span>
          <span class="cat-breadcrumb-current">${breadcrumbCurrent}</span>
        </nav>

        <div class="cat-page-title-row">
          <h1 class="cat-page-title" data-reveal>
            ${title}
          </h1>
          <p class="cat-page-intro" data-reveal>
            Lab-grown, built to last — ${products.length} ${products.length === 1 ? "piece" : "pieces"} in the current edit.
          </p>
        </div>
      </header>

      ${renderFilterBar(products.length)}

      ${
        products.length === 0
          ? `<div class="cat-empty"><p>No pieces yet — check back soon.</p></div>`
          : `<div class="cat-grid">${itemsHtml.join("")}</div>`
      }
    </section>
  `;
}

// ─── Events ─────────────────────────────────────────────────────────────────
export function initCategoryPageEvents(allProducts: Product[]) {
  // Quick-add from category cards
  document.addEventListener("click", quickAddHandler);

  function quickAddHandler(e: Event) {
    const target = e.target as HTMLElement;
    const btn = target.closest<HTMLElement>("[data-quick-add]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    const sku = btn.dataset.quickAdd;
    if (!sku) return;
    const product = allProducts.find((p) => p.sku === sku);
    if (!product) return;
    cartStore.add(productToCartItem(product));
    btn.classList.add("added");
    setTimeout(() => btn.classList.remove("added"), 800);
  }
}