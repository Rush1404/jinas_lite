// ─── Product Page ───────────────────────────────────────────────────────────
// Full dedicated page (not a modal) at #/product/{sku}. Structure mirrors
// Mejuri's PDP aesthetic:
//   - Left column: large sticky product image with zoom-hint affordance
//   - Right column: breadcrumb → title → price → material swatches →
//                   carat options → Add to Bag → description → feature list
//
// Keyboard navigation (←/→) and related products section included.
// Uses the same Product shape you already have in src/types/product.ts.
// ────────────────────────────────────────────────────────────────────────────

import type { Product } from "../../types/product";
import { formatCurrency, formatCategory } from "../../utils/filters";
import { routes } from "../../utils/router";

interface PageState {
  selectedCarat: number | null;
  selectedMaterial: "18k-gold" | "14k-gold" | "silver-925";
  quantity: number;
}

// Module-level state — the page re-renders on navigation so this resets naturally.
const state: PageState = {
  selectedCarat: null,
  selectedMaterial: "18k-gold",
  quantity: 1,
};

// ─── Material swatch row ────────────────────────────────────────────────────
function renderMaterialSwatches(): string {
  const swatches = [
    { id: "18k-gold", label: "18k Gold Vermeil", className: "swatch-gold-deep" },
    { id: "14k-gold", label: "14k Gold Vermeil", className: "swatch-gold" },
    { id: "silver-925", label: "Silver 925", className: "swatch-silver" },
  ] as const;

  return `
    <div class="pdp-material-row">
      <p class="pdp-material-label">${
        swatches.find((s) => s.id === state.selectedMaterial)?.label ?? ""
      }</p>
      <div class="pdp-swatches">
        ${swatches
          .map(
            (s) => `
              <button
                class="pdp-swatch ${s.className} ${
                  s.id === state.selectedMaterial ? "active" : ""
                }"
                data-material="${s.id}"
                data-label="${s.label}"
                aria-label="Select ${s.label}"
              ></button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

// ─── Carat options (uses Product.diamondCaratOptions) ───────────────────────
function renderCaratOptions(product: Product): string {
  if (!product.diamondCaratOptions?.length) return "";

  return `
    <div class="pdp-option-section">
      <p class="pdp-option-label">
        Diamond Carat
        <span class="pdp-option-count">(${product.diamondCaratOptions.length} options)</span>
      </p>
      <div class="pdp-carat-grid">
        ${product.diamondCaratOptions
          .map(
            (c) => `
              <button
                class="pdp-carat-option ${
                  c === state.selectedCarat ? "active" : ""
                }"
                data-carat="${c}"
              >${c.toFixed(2)} Ct</button>
            `
          )
          .join("")}
      </div>
    </div>
  `;
}

// ─── Feature bullets (icons + labels, Mejuri-style) ─────────────────────────
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

// ─── Specifications table (uses all the fields Jina actually tracks) ────────
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
      </div>
    </details>
  `;
}

// ─── Related products rail ──────────────────────────────────────────────────
function renderRelated(currentProduct: Product, allProducts: Product[]): string {
  const related = allProducts
    .filter(
      (p) => p.id !== currentProduct.id && p.subCategory === currentProduct.subCategory
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

// ─── Adjacent-product navigation (prev/next within the same subcategory) ───
function getAdjacent(
  current: Product,
  allProducts: Product[]
): { prev: Product | null; next: Product | null } {
  const siblings = allProducts.filter(
    (p) => p.subCategory === current.subCategory
  );
  const idx = siblings.findIndex((p) => p.id === current.id);
  return {
    prev: idx > 0 ? siblings[idx - 1] : null,
    next: idx < siblings.length - 1 ? siblings[idx + 1] : null,
  };
}

// ─── Top-level render ───────────────────────────────────────────────────────
export function renderProductPage(
  product: Product,
  allProducts: Product[]
): string {
  // Reset state for the newly-rendered product
  state.selectedCarat = product.selectedCarat;
  state.selectedMaterial = "18k-gold";
  state.quantity = 1;

  const { prev, next } = getAdjacent(product, allProducts);

  return `
    <article class="pdp-page">
      <!-- Breadcrumb + adjacent nav -->
      <nav class="pdp-breadcrumb-bar" aria-label="Product navigation">
        <div class="pdp-breadcrumb">
          <a href="${routes.landing()}">Home</a>
          <span class="pdp-breadcrumb-sep">/</span>
          <a href="${routes.shop()}">All Jewelry</a>
          <span class="pdp-breadcrumb-sep">/</span>
          <a href="${routes.category(product.subCategory)}">${
    formatCategory(product.subCategory)
  }</a>
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
        <!-- LEFT: sticky image column -->
        <div class="pdp-image-col">
          <div class="pdp-image-wrap" data-product-cursor>
            <button class="pdp-zoom-hint" aria-label="Zoom image">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
                <path d="M12 5v14M5 12h14" stroke-linecap="round"/>
              </svg>
            </button>
            <img src="${product.image}" alt="${product.name}" id="pdp-main-image" />
          </div>
          <!-- Secondary image, if available. Using the same image for now since
               Product only has one field — add a gallery array when ready. -->
          <div class="pdp-image-wrap pdp-image-secondary">
            <img src="${product.image}" alt="${product.name} — alt view" loading="lazy" />
          </div>
        </div>

        <!-- RIGHT: info column -->
        <div class="pdp-info-col">
          <div class="pdp-info-sticky">
            <div class="pdp-title-row">
              <h1 class="pdp-title">${product.name}</h1>
              <div class="pdp-rating" aria-label="Rated 4.8 out of 5">
                <span>4.8</span>
                <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                  <path d="M12 2l2.9 6.9 7.1.6-5.4 4.7 1.6 7L12 17.3 5.8 21.2l1.6-7L2 9.5l7.1-.6L12 2Z"/>
                </svg>
              </div>
            </div>

            <p class="pdp-sku">SKU: ${product.sku}</p>

            <div class="pdp-price-row">
              <span class="pdp-price">${formatCurrency(product.price)}</span>
              <span class="pdp-price-note">In stock · Ships within 3 days</span>
            </div>

            ${renderMaterialSwatches()}
            ${renderCaratOptions(product)}

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
              <button class="pdp-wishlist" aria-label="Add to wishlist">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.25">
                  <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 1 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>

            <p class="pdp-description">
              A modern take on a daily classic — designed to be worn alone or
              layered. Lab-grown diamonds set in recycled ${
                (state.selectedMaterial as string) === "silver-925"
                  ? "silver 925"
                  : "gold vermeil"
              }, hand-finished in small batches.
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

// ─── Events ─────────────────────────────────────────────────────────────────

let keyHandler: ((e: KeyboardEvent) => void) | null = null;

export function initProductPageEvents(product: Product, allProducts: Product[]) {
  // Material swatches
  document.querySelectorAll<HTMLButtonElement>("[data-material]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const value = btn.dataset.material as PageState["selectedMaterial"];
      state.selectedMaterial = value;
      // Update UI — clear active on all, set on this one
      document
        .querySelectorAll(".pdp-swatch")
        .forEach((s) => s.classList.remove("active"));
      btn.classList.add("active");
      const label = document.querySelector(".pdp-material-label");
      if (label) label.textContent = btn.dataset.label ?? "";
    });
  });

  // Carat options
  document.querySelectorAll<HTMLButtonElement>("[data-carat]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.selectedCarat = parseFloat(btn.dataset.carat!);
      document
        .querySelectorAll(".pdp-carat-option")
        .forEach((o) => o.classList.remove("active"));
      btn.classList.add("active");
    });
  });

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
      if (qtyValue) qtyValue.textContent = state.quantity.toString();
      updateAddBtnPrice();
    }
  });
  document.getElementById("pdp-qty-plus")?.addEventListener("click", () => {
    state.quantity++;
    if (qtyValue) qtyValue.textContent = state.quantity.toString();
    updateAddBtnPrice();
  });

  // Add to bag
  document.getElementById("pdp-add-to-bag")?.addEventListener("click", (e) => {
    const btn = e.currentTarget as HTMLButtonElement;
    console.log("[add-to-bag]", {
      sku: product.sku,
      material: state.selectedMaterial,
      carat: state.selectedCarat,
      quantity: state.quantity,
    });
    btn.classList.add("added");
    const labelSpan = btn.querySelector("span:first-child");
    if (labelSpan) labelSpan.textContent = "Added to bag";
    setTimeout(() => {
      btn.classList.remove("added");
      const s = btn.querySelector("span:first-child");
      if (s) s.textContent = "Add to Bag";
    }, 1800);
  });

  // Keyboard navigation between products (← / →)
  keyHandler = (e: KeyboardEvent) => {
    // Don't hijack arrows when the user is typing in an input/textarea
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