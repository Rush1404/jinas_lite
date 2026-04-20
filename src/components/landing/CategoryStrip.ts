// ─── Category Strip ─────────────────────────────────────────────────────────
// Four large photo tiles with a number label, title, and explore CTA.
// Images zoom on hover; CTA gap widens as a subtle direction cue.
// ────────────────────────────────────────────────────────────────────────────

import { landingCategories, type LandingCategory } from "../../data/landing";

function renderCategoryCard(cat: LandingCategory): string {
  return `
    <a
      href="${cat.href}"
      class="cat-card"
      data-reveal
      data-product-cursor
    >
      <span class="cat-num">${cat.num}</span>
      <img src="${cat.image}" alt="${cat.label}" loading="lazy" />
      <span class="cat-label">${cat.label}</span>
      <span class="cat-arrow">
        Explore
        <svg viewBox="0 0 14 10" fill="none">
          <path d="M1 5h12M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
        </svg>
      </span>
    </a>
  `;
}

export function renderCategoryStrip(): string {
  return `
    <section class="category-strip">
      <div class="strip-header">
        <h2 class="strip-title" data-reveal>
          Four <em>shapes</em><br>to start with.
        </h2>
        <div class="strip-meta" data-reveal>
          Shop by category
          <span>01 / 05 — The Edit</span>
        </div>
      </div>

      <div class="category-grid">
        ${landingCategories.map(renderCategoryCard).join("")}
      </div>
    </section>
  `;
}