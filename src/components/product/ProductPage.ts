// ─── Product Page ───────────────────────────────────────────────────────────
// Full dedicated PDP at #/product/{sku}. Per the project spec, listings have
// NO customization (no material/carat selectors). Specs are read-only.
//
// Layout:
//   - Left:  sticky image column (main image + thumbnail strip)
//   - Right: breadcrumb → title → SKU → price → quantity → Add to Bag
//            → description → feature bullets → spec table
//
// Keyboard arrows navigate between products in the same subcategory.
// ────────────────────────────────────────────────────────────────────────────

import type { Product } from "../../types/product";
import { formatCurrency, formatCategory } from "../../utils/filters";
import { routes } from "../../utils/router";
import { cartStore } from "../../lib/cartStore.ts";
import { productToCartItem } from "../../types/cart.ts";

interface PageState {
  quantity: number;
}

const state: PageState = { quantity: 1 };

// Returns the gallery, guaranteeing at least one entry (the primary image).
function getGallery(product: Product): string[] {
  if (product.images && product.images.length > 0) return product.images;
  return [product.image];
}

// ─── Feature bullets ────────────────────────────────────────────────────────
function renderFeatureList(): string {
  const features = [
    {
      label: "Water Resistant & Hypoallergenic",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25"><path d="M12 2.5c-3 4-6 7.5-6 11a6 6 0 0 0 12 0c0-3.5-3-7-6-11Z" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      label: "Made to Last — Lab Grown Diamond",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25"><path d="M12 3 4 10l8 11 8-11-8-7Z" stroke-linejoin="round"/><path d="M4 10h16M12 3v18" stroke-linejoin="round"/></svg>`,
    },
    {
      label: "94% Recycled Silver 925",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25"><path d="M3 12a9 9 0 0 1 15-6.7M21 12a9 9 0 0 1-15 6.7" stroke-linecap="round"/><path d="M18 2v4h-4M6 22v-4h4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    },
    {
      label: "Designed in Toronto",
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8Z" stroke-linejoin="round"/></svg>`,
    },
  ];

  return `
    <ul class="pdp-features">
      ${features
        .map(
          (f) => `
            <li class="pdp-feature">
              <span class="pdp-feature-icon">${f.icon}</span>
              <span>${f.label}</span>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

// ─── Specifications ─────────────────────────────────────────────────────────
function renderSpecs(product: Product): string {
  return `
    <details class="pdp-spec-details">
      <summary>View full specifications</summary>
      <div class="pdp-spec-grid">
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Collection</span>
          <span class="pdp-spec-value">${formatCategory(product.category)}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Diamond Carat</span>
          <span class="pdp-spec-value">${product.selectedCarat.toFixed(2)} Ct</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Silver 925 (gm)</span>
          <span class="pdp-spec-value">${product.silver925.toFixed(2)}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Gold Wt 18k (gm)</span>
          <span class="pdp-spec-value">${product.goldWt18k.toFixed(2)}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Gold Wt 14k (gm)</span>
          <span class="pdp-spec-value">${product.goldWt14k.toFixed(2)}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Diamond Wt (ct)</span>
          <span class="pdp-spec-value">${product.diamondWt.toFixed(2)}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Size</span>
          <span class="pdp-spec-value">${product.size.toFixed(2)} Ct</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">SKU</span>
          <span class="pdp-spec-value">${product.sku}</span>
        </div>
      </div>
    </details>
  `;
}

// ─── Related ────────────────────────────────────────────────────────────────
function renderRelated(currentProduct: Product, allProducts: Product[]): string {
  const related = allProducts
    .filter(
      (p) =>
        p.id !== currentProduct.id &&
        p.subCategory === currentProduct.subCategory &&
        p.isActive !== false
    )
    .slice(0, 4);

  if (related.length === 0) return "";

  return `
    <section class="pdp-related">
      <div class="pdp-related-header">
        <h2 data-reveal>Picked <em>for you</em></h2>
        <p data-reveal>More from the ${currentProduct.subCategory.toLowerCase().replace("_", " ")} collection.</p>
      </div>
      <div class="pdp-related-grid">
        ${related
          .map(
            (p) => `
              <a href="${routes.product(p.sku)}" class="pdp-related-card" data-reveal data-product-cursor>
                <div class="pdp-related-image">
                  <img src="${p.image}" alt="${p.name}" loading="lazy" />
                </div>
                <div class="pdp-related-info">
                  <span class="pdp-related-name">${p.name}</span>
                  <span class="pdp-related-price">${formatCurrency(p.price)}</span>
                </div>
              </a>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

// ─── Adjacent navigation ────────────────────────────────────────────────────
function getAdjacent(
  current: Product,
  allProducts: Product[]
): { prev: Product | null; next: Product | null } {
  const siblings = allProducts.filter(
    (p) => p.subCategory === current.subCategory && p.isActive !== false
  );
  const idx = siblings.findIndex((p) => p.id === current.id);
  return {
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx < siblings.length - 1 ? siblings[idx + 1] : null,
  };
}

// ─── Image column (main + thumbnails) ───────────────────────────────────────
function renderImageColumn(product: Product): string {
  const gallery = getGallery(product);
  const showThumbs = gallery.length > 1;

  return `
    <div class="pdp-image-col">
      <div class="pdp-image-wrap" data-product-cursor>
        <img src="${gallery[0]}" alt="${product.name}" id="pdp-main-image" />
      </div>
      ${
        showThumbs
          ? `
        <div class="pdp-thumb-strip" role="tablist" aria-label="Product images">
          ${gallery
            .map(
              (url, i) => `
                <button
                  type="button"
                  class="pdp-thumb ${i === 0 ? "is-active" : ""}"
                  data-thumb-index="${i}"
                  data-thumb-url="${url}"
                  aria-label="View image ${i + 1} of ${gallery.length}"
                  role="tab"
                  aria-selected="${i === 0 ? "true" : "false"}"
                >
                  <img src="${url}" alt="" loading="lazy" />
                </button>
              `
            )
            .join("")}
        </div>
      `
          : ""
      }
    </div>
  `;
}

// ─── Top-level render ───────────────────────────────────────────────────────
export function renderProductPage(
  product: Product,
  allProducts: Product[]
): string {
  state.quantity = 1;

  const { prev, next } = getAdjacent(product, allProducts);

  return `
    <article class="pdp-page">
      <nav class="pdp-breadcrumb-bar" aria-label="Product navigation">
        <div class="pdp-breadcrumb">
          <a href="${routes.landing()}">Home</a>
          <span class="pdp-breadcrumb-sep">/</span>
          <a href="${routes.category(product.subCategory)}">${formatCategory(product.subCategory)}</a>
          <span class="pdp-breadcrumb-sep">/</span>
          <span class="pdp-breadcrumb-current">${product.name}</span>
        </div>
        <div class="pdp-adjacent">
          ${
            prev
              ? `<a href="${routes.product(prev.sku)}" class="pdp-adj-btn" aria-label="Previous product" data-adj-prev>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
                    <path d="M15 6l-6 6 6 6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>`
              : `<span class="pdp-adj-btn disabled"></span>`
          }
          ${
            next
              ? `<a href="${routes.product(next.sku)}" class="pdp-adj-btn" aria-label="Next product" data-adj-next>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
                    <path d="M9 6l6 6-6 6" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </a>`
              : `<span class="pdp-adj-btn disabled"></span>`
          }
        </div>
      </nav>

      <div class="pdp-layout">
        <!-- LEFT: image -->
        ${renderImageColumn(product)}

        <!-- RIGHT: info -->
        <div class="pdp-info-col">
          <div class="pdp-info-sticky">
            <div class="pdp-title-row">
              <h1 class="pdp-title">${product.name}</h1>
            </div>

            <p class="pdp-sku">SKU: ${product.sku}</p>

            <div class="pdp-price-row">
              <span class="pdp-price">${formatCurrency(product.price)}</span>
              <span class="pdp-price-note">In stock · Ships within 3 days</span>
            </div>

            <div class="pdp-quantity-row">
              <span class="pdp-option-label">Quantity</span>
              <div class="pdp-quantity-control">
                <button class="pdp-qty-btn" id="pdp-qty-minus" aria-label="Decrease quantity">−</button>
                <span class="pdp-qty-value" id="pdp-qty-value">${state.quantity}</span>
                <button class="pdp-qty-btn" id="pdp-qty-plus" aria-label="Increase quantity">+</button>
              </div>
            </div>

            <div class="pdp-actions">
              <button class="pdp-add-to-bag" id="pdp-add-to-bag">
                <span>Add to Bag</span>
                <span class="pdp-add-price">${formatCurrency(product.price * state.quantity)}</span>
              </button>
            </div>

            <p class="pdp-description">
              ${
                product.description ||
                `A modern take on a daily classic — designed to be worn alone or layered.
                Lab-grown diamonds set in recycled metal, hand-finished in small batches.`
              }
            </p>

            ${renderFeatureList()}
            ${renderSpecs(product)}
          </div>
        </div>
      </div>

      ${renderRelated(product, allProducts)}
    </article>
  `;
}

let keyHandler: ((e: KeyboardEvent) => void) | null = null;

export function initProductPageEvents(product: Product, allProducts: Product[]) {
  // Quantity controls
  const qtyValue = document.getElementById("pdp-qty-value");
  const updateAddBtnPrice = () => {
    const priceEl = document.querySelector(".pdp-add-price");
    if (priceEl) {
      priceEl.textContent = formatCurrency(product.price * state.quantity);
    }
  };

  document.getElementById("pdp-qty-minus")?.addEventListener("click", () => {
    if (state.quantity > 1) {
      state.quantity--;
      if (qtyValue) qtyValue.textContent = String(state.quantity);
      updateAddBtnPrice();
    }
  });
  document.getElementById("pdp-qty-plus")?.addEventListener("click", () => {
    state.quantity++;
    if (qtyValue) qtyValue.textContent = String(state.quantity);
    updateAddBtnPrice();
  });

  // Add to bag — wires to real cartStore
  document.getElementById("pdp-add-to-bag")?.addEventListener("click", (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    cartStore.add(productToCartItem(product, state.quantity));
    btn.classList.add("added");
    const labelSpan = btn.querySelector("span:first-child");
    if (labelSpan) labelSpan.textContent = "Added to bag";
    setTimeout(() => {
      btn.classList.remove("added");
      const s = btn.querySelector("span:first-child");
      if (s) s.textContent = "Add to Bag";
    }, 1500);
  });

  // Thumbnail strip — click swaps the main image
  const mainImg = document.getElementById("pdp-main-image") as HTMLImageElement | null;
  const thumbs = document.querySelectorAll<HTMLButtonElement>(".pdp-thumb");
  thumbs.forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.dataset.thumbUrl;
      if (!url || !mainImg) return;
      mainImg.src = url;
      thumbs.forEach((t) => {
        t.classList.remove("is-active");
        t.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");
    });
  });

  // Keyboard navigation
  keyHandler = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;

    const { prev, next } = getAdjacent(product, allProducts);
    if (e.key === "ArrowLeft" && prev) {
      window.location.hash = routes.product(prev.sku);
    } else if (e.key === "ArrowRight" && next) {
      window.location.hash = routes.product(next.sku);
    }
  };
  document.addEventListener("keydown", keyHandler);
}

export function cleanupProductPage() {
  if (keyHandler) {
    document.removeEventListener("keydown", keyHandler);
    keyHandler = null;
  }
}