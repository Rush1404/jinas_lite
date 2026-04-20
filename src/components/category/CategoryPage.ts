// ─── Category Page ──────────────────────────────────────────────────────────
// Full-bleed grid of products for a single sub-category (Rings, Earrings, etc).
// Visual language matches the editorial landing page:
//   - Sticky filter bar with monospace labels + product count
//   - 4-column edge-to-edge grid (no gutter)
//   - "ADD +" button overlay on hover
//   - One promotional tile slotted into the grid
//
// Uses the same Product data shape as the existing catalog, filtered by
// subCategory. Clicking a card navigates to #/product/{sku}.
// ────────────────────────────────────────────────────────────────────────────

import type { Product, SubCategory } from "../../types/product";
import { formatCurrency } from "../../utils/filters";
import { routes, categoryLabel } from "../../utils/router";

// Promotional tile config per category — easy for Jina to update later.
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
    cta: "The Stacking Edit",
    href: "#/shop",
    accent: "gold",
  },
  EARRING: {
    headline: "Shop 25% off.",
    sublabel: "Spend $150 or more.",
    cta: "Shop now",
    href: "#/shop",
    accent: "gold",
  },
  LOOSE_BRACELET: {
    headline: "The Eternity edit.",
    sublabel: "Made to layer.",
    cta: "Explore",
    href: "#/shop",
    accent: "moss",
  },
  PENDANT: {
    headline: "Daily delicates.",
    sublabel: "Worn forever.",
    cta: "Shop pendants",
    href: "#/shop",
    accent: "bone",
  },
  ALL: {
    headline: "View everything.",
    sublabel: "One hundred pieces.",
    cta: "Shop all",
    href: "#/shop",
    accent: "gold",
  },
};

// ─── Product Card ───────────────────────────────────────────────────────────
function renderCard(product: Product): string {
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
          <div class="cat-swatches" aria-label="Available metals">
            <span class="swatch swatch-gold" title="18k gold vermeil"></span>
            <span class="swatch swatch-silver" title="Silver 925"></span>
          </div>
          <span class="cat-product-sku">${product.sku}</span>
        </div>
      </div>
    </a>
  `;
}

// ─── Promotional tile ───────────────────────────────────────────────────────
function renderPromo(promo: PromoTile): string {
  return `
    <a href="${promo.href}" class="cat-promo-tile cat-promo-${promo.accent}" data-reveal>
      <div class="cat-promo-inner">
        <span class="cat-promo-kicker">The Edit</span>
        <h3 class="cat-promo-headline">${promo.headline}</h3>
        <p class="cat-promo-sublabel">${promo.sublabel}</p>
        <span class="cat-promo-cta">
          ${promo.cta}
          <svg viewBox="0 0 14 10" fill="none" width="14" height="10">
            <path d="M1 5h12M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </span>
      </div>
    </a>
  `;
}

// ─── Filter bar (placeholder actions — wires into your real filters later) ──
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

// ─── Top-level render ───────────────────────────────────────────────────────
export function renderCategoryPage(
  subCategory: SubCategory,
  products: Product[]
): string {
  const filtered = products.filter((p) => p.subCategory === subCategory);
  const promo = PROMO_BY_CATEGORY[subCategory];

  // Insert promo tile after the 3rd product (top-right of first row in 4-col grid)
  const itemsHtml: string[] = [];
  filtered.forEach((p, i) => {
    itemsHtml.push(renderCard(p));
    if (i === 2) itemsHtml.push(renderPromo(promo));
  });

  // If there are fewer than 3 products, append the promo at the end
  if (filtered.length <= 2) {
    itemsHtml.push(renderPromo(promo));
  }

  return `
    <section class="category-page">
      <header class="cat-page-header">
        <nav class="cat-breadcrumb" aria-label="Breadcrumb">
          <a href="${routes.landing()}">Home</a>
          <span class="cat-breadcrumb-sep">/</span>
          <a href="${routes.shop()}">All Jewelry</a>
          <span class="cat-breadcrumb-sep">/</span>
          <span class="cat-breadcrumb-current">${categoryLabel(subCategory)}</span>
        </nav>

        <div class="cat-page-title-row">
          <h1 class="cat-page-title" data-reveal>
            ${categoryLabel(subCategory)}
          </h1>
          <p class="cat-page-intro" data-reveal>
            Lab-grown, built to last — ${filtered.length} ${filtered.length === 1 ? "piece" : "pieces"} in the current edit.
          </p>
        </div>
      </header>

      ${renderFilterBar(filtered.length)}

      ${
        filtered.length === 0
          ? `<div class="cat-empty">
              <p>No pieces in this category yet.</p>
              <a href="${routes.shop()}" class="btn-ghost"><span>View all jewelry</span></a>
            </div>`
          : `<div class="cat-grid">${itemsHtml.join("")}</div>`
      }
    </section>
  `;
}

// ─── Events — quick-add button + filter stubs ───────────────────────────────
export function initCategoryPageEvents() {
  // Quick add — stop the anchor navigation so we don't jump to the product page
  document.querySelectorAll<HTMLButtonElement>("[data-quick-add]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const sku = btn.dataset.quickAdd;
      console.log("[quick-add]", sku);
      // TODO: wire to real cart logic when you have it
      btn.classList.add("added");
      const span = btn.querySelector("span");
      if (span) span.textContent = "Added";
      setTimeout(() => {
        btn.classList.remove("added");
        const s = btn.querySelector("span");
        if (s) s.textContent = "Add";
      }, 1500);
    });
  });

  // Filter triggers — stubs for now, hook into Filters.ts when ready
  document.querySelectorAll<HTMLButtonElement>("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      console.log("[filter]", btn.dataset.filter);
    });
  });
}