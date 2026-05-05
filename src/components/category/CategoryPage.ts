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
import {
  renderCategoryFilterBar,
  mountCategoryFilters,
} from "./CategoryFilters";

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

function cardSwatchLabel(color: string): string {
  return color
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function renderCardSwatches(colors: string[]): string {
  if (colors.length === 0) {
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
//
// Note: cards intentionally do NOT carry `data-reveal`. The scroll-reveal
// IntersectionObserver runs once at page mount; cards re-rendered inside
// the filter callback would never receive their `.in` class and would
// stay stuck at opacity:0. Keeping cards visible by default makes
// filter changes feel snappy rather than fading in.
function renderCard(product: Product): string {
  const colors = product.gallery ? availableColors(product.gallery) : [];
  const swatchesHtml = renderCardSwatches(colors);

  return `
    <a
      href="${routes.product(product.sku)}"
      class="cat-product-card"
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

// ─── Grid + empty state ─────────────────────────────────────────────────────

function renderGridInner(products: Product[]): string {
  if (products.length === 0) {
    return `
      <div class="cat-empty">
        <p>No pieces match those filters.</p>
      </div>
    `;
  }
  return `<div class="cat-grid">${products.map(renderCard).join("")}</div>`;
}

// ─── Render: by subcategory ─────────────────────────────────────────────────
//
// The renderers stash their filtered product set in `lastPageProducts` so
// `initCategoryPageEvents` can pick it up after the DOM is mounted. This
// avoids re-deriving the route filter from the URL (which would couple
// the filter module to the router's slug format).
let lastPageProducts: Product[] = [];

export function renderCategoryPage(
  subCategory: SubCategory,
  products: Product[]
): string {
  const filtered = products.filter(
    (p) => p.subCategory === subCategory && p.isActive !== false
  );
  lastPageProducts = filtered;
  const promo = PROMO_BY_CATEGORY[subCategory];

  return renderShell({
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
  lastPageProducts = filtered;
  const promo = PROMO_BY_GENDER[gender];

  return renderShell({
    title: genderLabel(gender),
    breadcrumbCurrent: genderLabel(gender),
    products: filtered,
    promo,
  });
}

// ─── Render: all jewelry ────────────────────────────────────────────────────
export function renderAllJewelryPage(products: Product[]): string {
  const filtered = products.filter((p) => p.isActive !== false);
  lastPageProducts = filtered;

  return renderShell({
    title: "All Jewelry",
    breadcrumbCurrent: "All Jewelry",
    products: filtered,
    promo: PROMO_BY_CATEGORY.ALL,
  });
}

// ─── Shared shell ───────────────────────────────────────────────────────────
//
// Renders the page chrome (header + filter bar + grid). The grid lives
// inside a `[data-cat-grid-wrap]` container so the filter callback can
// re-populate it without re-rendering the bar.
function renderShell(opts: {
  title: string;
  breadcrumbCurrent: string;
  products: Product[];
  promo: PromoTile;
}): string {
  const { title, breadcrumbCurrent, products } = opts;

  return `
    <section class="category-page" data-cat-page>
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
            Lab-grown, built to last — <span data-cat-intro-count>${products.length} ${products.length === 1 ? "piece" : "pieces"}</span> in the current edit.
          </p>
        </div>
      </header>

      ${renderCategoryFilterBar(products.length)}

      <div class="cat-grid-wrap" data-cat-grid-wrap>
        ${renderGridInner(products)}
      </div>
    </section>
  `;
}

// ─── Events ─────────────────────────────────────────────────────────────────

let teardownFilters: (() => void) | null = null;

export function initCategoryPageEvents(allProducts: Product[]) {
  // The renderer stashed the route-filtered set on `lastPageProducts`
  // (e.g. "all rings" or "all women's"). The filter module narrows
  // *within* that set — sort/material/colour/price never expand the
  // page beyond its primary filter.
  const pageProducts = lastPageProducts;

  // Quick-add from category cards
  document.addEventListener("click", quickAddHandler);

  // Mount filters
  if (teardownFilters) teardownFilters();
  teardownFilters = mountCategoryFilters(pageProducts, (filtered) => {
    // Re-render grid
    const wrap = document.querySelector<HTMLElement>("[data-cat-grid-wrap]");
    if (wrap) wrap.innerHTML = renderGridInner(filtered);

    // Update count in the filter bar + intro paragraph
    const countEl = document.querySelector<HTMLElement>(".cat-product-count");
    if (countEl) {
      countEl.textContent = `(${filtered.length} ${filtered.length === 1 ? "Piece" : "Pieces"})`;
    }
    const introCount = document.querySelector<HTMLElement>("[data-cat-intro-count]");
    if (introCount) {
      introCount.textContent = `${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"}`;
    }
  });

  // Initial render: the filter module starts with sort=match + full
  // price range (identity), so the grid is already in sync with the bar.

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