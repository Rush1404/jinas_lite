// ─── Gender Strip ───────────────────────────────────────────────────────────
// Two large editorial tiles for "Women" and "Men" — sits below the
// subcategory strip on the landing page. Same visual language as
// CategoryStrip but with bigger tiles and more typographic weight, since
// it's the highest-level filter on the site.
// ────────────────────────────────────────────────────────────────────────────

import { landingGenderCategories, type LandingCategory } from "../../data/landing.ts";

function renderTile(cat: LandingCategory): string {
  return `
    <a
      href="${cat.href}"
      class="gender-card"
      data-reveal
      data-product-cursor
    >
      <span class="cat-num">${cat.num}</span>
      <img src="${cat.image}" alt="Shop ${cat.label}" loading="lazy" />
      <div class="gender-card-overlay">
        <span class="gender-card-label">${cat.label}</span>
        <span class="gender-card-cta">
          Shop the edit
          <svg viewBox="0 0 14 10" fill="none">
            <path d="M1 5h12M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
          </svg>
        </span>
      </div>
    </a>
  `;
}

export function renderGenderStrip(): string {
  return `
    <section class="gender-strip">
      <div class="strip-header">
        <h2 class="strip-title" data-reveal>
          Two <em>collections</em>,<br>one philosophy.
        </h2>
        <div class="strip-meta" data-reveal>
          Shop by who it's for
          <span>02 / 05 — The Edit</span>
        </div>
      </div>

      <div class="gender-grid">
        ${landingGenderCategories.map(renderTile).join("")}
      </div>
    </section>
  `;
}