import "./styles/main.css";
import "./styles/landing.css";
import "./styles/shop.css";

import { mockProducts } from "./data/products.ts";
import { Product, FilterState } from "./types/product.ts";
import { filterProducts } from "./utils/filters.ts";
import { renderHeader } from "./components/Header.ts";
import {
  renderFilters,
  initFilterEvents,
  setFilterChangeCallback,
} from "./components/Filters.ts";
import {
  renderProductGrid,
  initProductGridEvents,
} from "./components/ProductGrid.ts";
import {
  renderProductDetail,
  initProductDetailEvents,
  cleanupProductDetail,
} from "./components/ProductDetail.ts";

// Landing
import {
  renderLandingPage,
  initLandingPage,
  cleanupLandingPage,
} from "./components/landing/LandingPage.ts";

// Shop — category + product pages
import {
  renderCategoryPage,
  initCategoryPageEvents,
} from "./components/category/CategoryPage.ts";
import {
  renderProductPage,
  initProductPageEvents,
  cleanupProductPage,
} from "./components/product/ProductPage.ts";

// Shared landing chrome (announce bar, header, footer) — reused on shop pages
// so the whole site feels like one brand.
import { renderAnnounceBar } from "./components/landing/AnnounceBar.ts";
import { renderLandingHeader } from "./components/landing/LandingHeader.ts";
import {
  renderLandingFooter,
  initFooterEvents,
} from "./components/landing/LandingFooter.ts";

import { initCustomCursor } from "./utils/cursor.ts";
import { initScrollReveal } from "./utils/reveal.ts";
import { parseRoute, onRouteChange, type Route } from "./utils/router.ts";

// ─── State ──────────────────────────────────────────────────────────────────
let filteredProducts: Product[] = [...mockProducts];
let activeProductIndex: number | null = null;

// Effects that need cleanup between route transitions
let cursorHandle: { destroy: () => void } | null = null;
let revealHandle: { destroy: () => void } | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

// ─── Route lifecycle ────────────────────────────────────────────────────────
function teardown() {
  cursorHandle?.destroy();
  revealHandle?.destroy();
  cursorHandle = null;
  revealHandle = null;

  cleanupLandingPage();
  cleanupProductDetail();
  cleanupProductPage();

  document.body.style.overflow = "";
  document.body.classList.remove("landing-mode");
  activeProductIndex = null;

  // Scroll to top on every route change — prevents the "landed on a page
  // already scrolled halfway down" problem
  window.scrollTo(0, 0);
}

function mountEditorialShell(mainHtml: string) {
  // Every non-legacy-catalog page gets the landing chrome so the whole site
  // feels cohesive (same header, same footer, same palette).
  document.body.classList.add("landing-mode");
  app.innerHTML = `
    ${renderAnnounceBar()}
    ${renderLandingHeader()}
    <main class="landing-main">
      ${mainHtml}
    </main>
    ${renderLandingFooter()}
  `;
  cursorHandle = initCustomCursor();
  revealHandle = initScrollReveal();
  initFooterEvents();
}

function renderCurrentRoute() {
  const route = parseRoute();
  teardown();

  switch (route.kind) {
    case "landing":
      renderLanding();
      break;
    case "shop":
      renderLegacyCatalog(); // Your existing filter/grid/modal flow
      break;
    case "category":
      renderCategory(route);
      break;
    case "product":
      renderProduct(route);
      break;
  }
}

// ─── Landing ────────────────────────────────────────────────────────────────
function renderLanding() {
  document.body.classList.add("landing-mode");
  app.innerHTML = renderLandingPage();
  initLandingPage();
}

// ─── Category (Rings, Earrings, Bracelets, Pendants) ────────────────────────
function renderCategory(route: Extract<Route, { kind: "category" }>) {
  mountEditorialShell(renderCategoryPage(route.subCategory, mockProducts));
  initCategoryPageEvents();
}

// ─── Product detail ─────────────────────────────────────────────────────────
function renderProduct(route: Extract<Route, { kind: "product" }>) {
  const product = mockProducts.find(
    (p) => p.sku.toUpperCase() === route.sku.toUpperCase()
  );

  if (!product) {
    // Minimal 404 — stays in editorial shell so it doesn't feel jarring
    mountEditorialShell(`
      <section class="category-page">
        <div class="cat-empty" style="padding: 120px 24px;">
          <h1 style="font-family: var(--landing-display); font-size: 48px; font-weight: 300; color: var(--ink);">
            Not found
          </h1>
          <p>We couldn't find a piece with SKU <strong>${route.sku}</strong>.</p>
          <a href="#/shop" class="btn-ghost"><span>Browse all jewelry</span></a>
        </div>
      </section>
    `);
    return;
  }

  mountEditorialShell(renderProductPage(product, mockProducts));
  initProductPageEvents(product, mockProducts);
}

// ─── Legacy catalog (your existing filter + grid + modal overlay) ───────────
function renderLegacyCatalog() {
  app.innerHTML = `
    ${renderHeader()}
    <main class="page-container">
      <h1 class="page-title">Lab Grown Diamond with Silver</h1>
      <div class="catalog-layout">
        <div id="filters-container">
          ${renderFilters()}
        </div>
        <div id="product-grid-container">
          ${renderProductGrid(filteredProducts)}
        </div>
      </div>
    </main>
    <div id="product-detail-container"></div>
  `;
  initFilterEvents();
  initProductGridEvents(openProductDetail);
}

setFilterChangeCallback((filters: FilterState) => {
  filteredProducts = filterProducts(mockProducts, filters);
  const gridContainer = document.getElementById("product-grid-container");
  if (gridContainer) {
    gridContainer.innerHTML = renderProductGrid(filteredProducts);
    initProductGridEvents(openProductDetail);
  }
});

function openProductDetail(productId: string) {
  const idx = filteredProducts.findIndex((p) => p.id === productId);
  if (idx === -1) return;
  activeProductIndex = idx;
  renderDetailModal();
}

function renderDetailModal() {
  if (activeProductIndex === null) return;
  const product = filteredProducts[activeProductIndex];
  if (!product) return;

  const container = document.getElementById("product-detail-container");
  if (!container) return;

  container.innerHTML = renderProductDetail(
    product,
    activeProductIndex,
    filteredProducts.length
  );
  document.body.style.overflow = "hidden";

  initProductDetailEvents({
    onClose: closeDetail,
    onPrev: () => navigateModalProduct(-1),
    onNext: () => navigateModalProduct(1),
  });
}

function closeDetail() {
  cleanupProductDetail();
  const container = document.getElementById("product-detail-container");
  if (container) container.innerHTML = "";
  activeProductIndex = null;
  document.body.style.overflow = "";
}

function navigateModalProduct(direction: number) {
  if (activeProductIndex === null) return;
  const newIndex = activeProductIndex + direction;
  if (newIndex < 0 || newIndex >= filteredProducts.length) return;
  activeProductIndex = newIndex;
  cleanupProductDetail();
  renderDetailModal();
}

// ─── Bootstrap ──────────────────────────────────────────────────────────────
onRouteChange(renderCurrentRoute);
renderCurrentRoute();