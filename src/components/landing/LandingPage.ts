// ─── Landing Page ───────────────────────────────────────────────────────────
// Composes every landing-page section and owns the init / cleanup lifecycle.
// Call `renderLandingPage()` to get the HTML string, then `initLandingPage()`
// once the DOM is in place to wire up the cursor, scroll-reveal, and forms.
// ────────────────────────────────────────────────────────────────────────────

import { renderAnnounceBar } from "./AnnounceBar";
import { renderLandingHeader } from "./LandingHeader";
import { renderHero } from "./Hero";
import { renderCategoryStrip } from "./CategoryStrip";
import { renderManifesto } from "./Manifesto";
import { renderFeaturedProducts } from "./FeaturedProducts";
import { renderSplitFeature } from "./SplitFeature";
import { renderLandingFooter, initFooterEvents } from "./LandingFooter";

import { initCustomCursor } from "../../utils/cursor";
import { initScrollReveal } from "../../utils/reveal";

export function renderLandingPage(): string {
  return `
    ${renderAnnounceBar()}
    ${renderLandingHeader()}
    <main class="landing-main">
      ${renderHero()}
      ${renderCategoryStrip()}
      ${renderManifesto()}
      ${renderFeaturedProducts()}
      ${renderSplitFeature()}
    </main>
    ${renderLandingFooter()}
  `;
}

// Handles to destroy behaviors when navigating away from the landing page.
let cursorHandle: { destroy: () => void } | null = null;
let revealHandle: { destroy: () => void } | null = null;

export function initLandingPage() {
  // Mark body so landing-only styles (palette, grain overlay) apply
  document.body.classList.add("landing-mode");

  cursorHandle = initCustomCursor();
  revealHandle = initScrollReveal();
  initFooterEvents();
}

export function cleanupLandingPage() {
  document.body.classList.remove("landing-mode");
  cursorHandle?.destroy();
  revealHandle?.destroy();
  cursorHandle = null;
  revealHandle = null;
}