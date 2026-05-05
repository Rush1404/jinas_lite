// ─── Featured Products ──────────────────────────────────────────────────────
// "The edit, picked by Jina" — a curated strip of up to six products
// from the live catalog. The picks are stored as SKUs (see
// services/featuredService.ts) and resolved against the catalog at
// render time, so prices, names, and primary images always stay in
// sync with the admin-managed source of truth.
//
// Rendering rules:
//   - Zero picks → render an admin nudge in dev / nothing in prod.
//   - 1–2 picks  → simple grid, no asymmetric variants.
//   - 3+ picks   → asymmetric editorial layout (every 3rd card "tall",
//                  every 4th "offset") matching the original design.
//
// SKUs that don't resolve (product deleted or hidden) are filtered out
// silently — the landing page never shows broken cards.
// ────────────────────────────────────────────────────────────────────────────

import type { Product } from "../../types/product";
import { routes } from "../../utils/router";
import { formatCurrency } from "../../utils/filters";
import { getFeaturedSkus } from "../../services/featuredService";

// Map a product's specs to a short subtitle for the card. Mirrors the
// look of the old hand-written `desc` strings ("1.00 ct · 18k vermeil").
function formatDesc(p: Product): string {
  const parts: string[] = [];
  if (p.diamondWt && p.diamondWt > 0) {
    parts.push(`${p.diamondWt.toFixed(2)} ct`);
  }
  if (p.goldWt18k && p.goldWt18k > 0) {
    parts.push("18k gold");
  } else if (p.goldWt14k && p.goldWt14k > 0) {
    parts.push("14k gold");
  } else if (p.silver925 && p.silver925 > 0) {
    parts.push("silver 925");
  }
  return parts.join(" · ");
}

// Editorial variant assignment based on display index.
// 6 cards: positions 2 ("tall") and 5 ("offset") break the 3-col grid.
function variantAt(index: number, total: number): "tall" | "offset" | "" {
  if (total < 3) return "";
  if (index === 2) return "tall";
  if (index === 5) return "offset";
  return "";
}

function variantClass(v: "tall" | "offset" | ""): string {
  if (v === "tall") return "feature-tall";
  if (v === "offset") return "feature-offset";
  return "";
}

function renderProductCard(p: Product, index: number, total: number): string {
  const variant = variantAt(index, total);
  const desc = formatDesc(p);

  return `
    <a
      href="${routes.product(p.sku)}"
      class="product-card ${variantClass(variant)}"
      data-reveal
      data-product-cursor
    >
      <div class="product-image-wrap">
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="product-quick-add">+ Quick add</div>
      </div>
      <div class="product-info">
        <div class="product-name">${p.name}</div>
        <div class="product-price">${formatCurrency(p.price)}</div>
        ${desc ? `<span class="product-desc">${desc}</span>` : ""}
      </div>
    </a>
  `;
}

const arrowSvg = `
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
    <path d="M1 5h12M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`;

/**
 * Render the featured strip. Pass the full product catalog — the
 * component picks out the featured SKUs in saved order, drops any
 * that don't resolve (deleted / hidden), and lays out the rest.
 *
 * Always wraps the result in a `[data-featured-mount]` container so
 * the landing page can swap in real picks once the catalog finishes
 * loading async, without re-rendering the rest of the page.
 *
 * If no SKUs are picked yet (or the catalog hasn't loaded), the inner
 * content is empty — but the mount stays in the DOM.
 */
export function renderFeaturedProducts(allProducts: Product[]): string {
  return `<div data-featured-mount>${renderFeaturedInner(allProducts)}</div>`;
}

/**
 * Re-render only the featured section in place. Called by the landing
 * page after the catalog has loaded async, so the section can be
 * upgraded without remounting the whole page.
 *
 * The scroll-reveal IntersectionObserver was bound at initial page
 * mount; elements injected by this refresh aren't watched, so we mark
 * any `[data-reveal]` children as `.in` immediately. The trade-off:
 * the async-upgrade path skips the fade-in (the section just appears),
 * but the more common cached-catalog path still fades in normally
 * because that hits the initial render with picks already resolved.
 */
export function refreshFeaturedProducts(allProducts: Product[]): void {
  const mount = document.querySelector<HTMLElement>("[data-featured-mount]");
  if (!mount) return;
  mount.innerHTML = renderFeaturedInner(allProducts);
  mount
    .querySelectorAll<HTMLElement>("[data-reveal]")
    .forEach((el) => el.classList.add("in"));
}

function renderFeaturedInner(allProducts: Product[]): string {
  const featuredSkus = getFeaturedSkus();

  const bySku = new Map<string, Product>();
  for (const p of allProducts) {
    if (p.isActive !== false) bySku.set(p.sku.toUpperCase(), p);
  }

  const picks: Product[] = [];
  for (const sku of featuredSkus) {
    const product = bySku.get(sku.toUpperCase());
    if (product) picks.push(product);
  }

  if (picks.length === 0) return "";

  const total = picks.length;
  const subtitle = `${total} ${total === 1 ? "piece" : "pieces"} · Spring 2026`;

  return `
    <section class="featured">
      <div class="featured-header" id="edit">
        <h2 data-reveal>The <em>edit</em>,<br>picked by Jina.</h2>
        <div class="meta" data-reveal>${subtitle}</div>
      </div>

      <div class="featured-grid">
        ${picks.map((p, i) => renderProductCard(p, i, total)).join("")}
      </div>

      <div class="featured-footer" data-reveal>
        <a href="${routes.all()}" class="btn-primary">
          <span>View all jewelry</span>
          ${arrowSvg}
        </a>
      </div>
    </section>
  `;
}