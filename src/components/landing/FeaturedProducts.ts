// ─── Featured Products ──────────────────────────────────────────────────────
// Dark-moss section with an asymmetric product grid. Each card links to
// #/product/{sku} — SKUs come from data/landing.ts and map to mockProducts.
// ────────────────────────────────────────────────────────────────────────────

import { landingProducts, type LandingProduct } from "../../data/landing";
import { routes } from "../../utils/router";

function variantClass(variant: LandingProduct["variant"]): string {
  if (variant === "tall") return "feature-tall";
  if (variant === "offset") return "feature-offset";
  return "";
}

function renderProductCard(p: LandingProduct): string {
  const badge = p.badge
    ? `<span class="product-badge">${p.badge}</span>`
    : "";

  return `
    <a
      href="${routes.product(p.sku)}"
      class="product-card ${variantClass(p.variant)}"
      data-reveal
      data-product-cursor
    >
      <div class="product-image-wrap">
        ${badge}
        <img src="${p.image}" alt="${p.name}" loading="lazy" />
        <div class="product-quick-add">+ Quick add</div>
      </div>
      <div class="product-info">
        <div>
          <div class="product-name">${p.name}</div>
          <span class="product-desc">${p.desc}</span>
        </div>
        <div class="product-price">${p.price}</div>
      </div>
    </a>
  `;
}

const arrowSvg = `
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
    <path d="M1 5h12M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`;

export function renderFeaturedProducts(): string {
  return `
    <section class="featured">
      <div class="featured-header">
        <h2 data-reveal>The <em>edit</em>,<br>picked by Jina.</h2>
        <div class="meta" data-reveal>Six pieces · Spring 2026</div>
      </div>

      <div class="featured-grid">
        ${landingProducts.map(renderProductCard).join("")}
      </div>

      <div class="featured-footer" data-reveal>
        <a href="${routes.shop()}" class="btn-primary">
          <span>View all jewelry</span>
          ${arrowSvg}
        </a>
      </div>
    </section>
  `;
}