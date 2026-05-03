// ─── Product Page ───────────────────────────────────────────────────────────
// Full dedicated PDP at #/product/{sku}.
//
// Layout:
//   - Left:  sticky image column (main image + color swatches + thumbnail strip)
//   - Right: breadcrumb → title → SKU → price → quantity → Add to Bag
//            → description → feature bullets → spec table
//
// Color behavior:
//   - If the product's gallery has more than one color tag, swatches render
//     above the thumbnail strip.
//   - Selecting a swatch filters the thumbnail strip to images tagged with
//     that color (plus any untagged "shown for all colors" images).
//   - The main image swaps to the first matching photo for the new color.
// ────────────────────────────────────────────────────────────────────────────

import {
  type Product,
  type GalleryImage,
  availableColors,
  galleryForColor,
} from "../../types/product";
import { formatCurrency, formatCategory } from "../../utils/filters";
import { routes } from "../../utils/router";
import { cartStore } from "../../lib/cartStore.ts";
import { productToCartItem } from "../../types/cart.ts";

interface PageState {
  quantity: number;
  selectedColor: string | null;
}

const state: PageState = { quantity: 1, selectedColor: null };

// Returns the gallery, guaranteeing at least one entry.
function getGallery(product: Product): GalleryImage[] {
  if (product.gallery && product.gallery.length > 0) return product.gallery;
  return [{ url: product.image, color: null }];
}

// Pretty-print a color slug for the UI ("rose gold" → "Rose Gold").
function formatColorLabel(color: string): string {
  return color
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

// Map a color name to a swatch CSS class. Falls back to a generic class
// (which uses the color name as a CSS-friendly attr).
function swatchClassFor(color: string): string {
  const slug = color.toLowerCase().replace(/\s+/g, "-");
  switch (slug) {
    case "gold":
      return "swatch-gold";
    case "gold-deep":
    case "yellow-gold":
      return "swatch-gold-deep";
    case "silver":
    case "white-gold":
      return "swatch-silver";
    case "rose-gold":
      return "swatch-rose-gold";
    default:
      return `swatch-${slug}`;
  }
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
    <details class="pdp-spec-details" open>
      <summary>Specifications</summary>
      <div class="pdp-spec-grid">
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Gold 18k (gm)</span>
          <span class="pdp-spec-value">${product.goldWt18k}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Gold 14k (gm)</span>
          <span class="pdp-spec-value">${product.goldWt14k}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Diamond Wt (ct)</span>
          <span class="pdp-spec-value">${product.diamondWt}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Silver 925 (gm)</span>
          <span class="pdp-spec-value">${product.silver925}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Size</span>
          <span class="pdp-spec-value">${product.size}</span>
        </div>
        <div class="pdp-spec-item">
          <span class="pdp-spec-label">Category</span>
          <span class="pdp-spec-value">${formatCategory(product.category)}</span>
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

// ─── Image column (main + swatches + thumbnails) ────────────────────────────
function renderImageColumn(product: Product): string {
  const fullGallery = getGallery(product);
  const colors = availableColors(fullGallery);
  const initialColor = colors[0] ?? null;
  const initialGallery = galleryForColor(fullGallery, initialColor);
  const showThumbs = initialGallery.length > 1 || colors.length > 1;

  // Cache the full gallery on the DOM so the swatch handler can re-filter
  // without going back through the data layer.
  const fullGalleryAttr = encodeURIComponent(JSON.stringify(fullGallery));

  return `
    <div class="pdp-image-col" data-full-gallery="${fullGalleryAttr}">
      <div class="pdp-image-wrap" data-product-cursor>
        <img src="${initialGallery[0]?.url ?? product.image}" alt="${product.name}" id="pdp-main-image" />
      </div>

      ${
        colors.length > 1
          ? `
        <div class="pdp-material-row">
          <span class="pdp-material-label">
            Color: <span id="pdp-color-name">${formatColorLabel(initialColor!)}</span>
          </span>
          <div class="pdp-swatches" role="radiogroup" aria-label="Color">
            ${colors
              .map(
                (c) => `
                  <button
                    type="button"
                    class="pdp-swatch ${swatchClassFor(c)} ${c === initialColor ? "active" : ""}"
                    data-color="${c}"
                    role="radio"
                    aria-checked="${c === initialColor ? "true" : "false"}"
                    aria-label="${formatColorLabel(c)}"
                    title="${formatColorLabel(c)}"
                  ></button>
                `
              )
              .join("")}
          </div>
        </div>
      `
          : ""
      }

      ${
        showThumbs
          ? `
        <div class="pdp-thumb-strip" id="pdp-thumb-strip" role="tablist" aria-label="Product images">
          ${renderThumbs(initialGallery)}
        </div>
      `
          : ""
      }
    </div>
  `;
}

// Renders just the thumbnail buttons, given a filtered gallery. Used by both
// the initial render and the swatch click handler.
function renderThumbs(gallery: GalleryImage[]): string {
  return gallery
    .map(
      (g, i) => `
        <button
          type="button"
          class="pdp-thumb ${i === 0 ? "is-active" : ""}"
          data-thumb-index="${i}"
          data-thumb-url="${g.url}"
          aria-label="View image ${i + 1} of ${gallery.length}"
          role="tab"
          aria-selected="${i === 0 ? "true" : "false"}"
        >
          <img src="${g.url}" alt="" loading="lazy" />
        </button>
      `
    )
    .join("");
}

// ─── Top-level render ───────────────────────────────────────────────────────
export function renderProductPage(
  product: Product,
  allProducts: Product[]
): string {
  state.quantity = 1;
  state.selectedColor = availableColors(getGallery(product))[0] ?? null;

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
        ${renderImageColumn(product)}

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

  // ── Image gallery (color-aware) ─────────────────────────────────────────
  const imageCol = document.querySelector<HTMLElement>(".pdp-image-col");
  const mainImg = document.getElementById("pdp-main-image") as HTMLImageElement | null;
  const thumbStrip = document.getElementById("pdp-thumb-strip");
  const colorNameEl = document.getElementById("pdp-color-name");

  // Read the cached full gallery off the DOM
  let fullGallery: GalleryImage[] = [];
  try {
    const raw = imageCol?.dataset.fullGallery;
    if (raw) fullGallery = JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    console.error("Failed to parse full gallery:", e);
  }

  // Wires up the thumbnail click handlers. Re-called whenever the strip
  // re-renders so the new buttons are live.
  const wireThumbs = () => {
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
  };
  wireThumbs();

  // Swatch clicks → re-filter thumbs + swap main image
  const swatches = document.querySelectorAll<HTMLButtonElement>(".pdp-swatch");
  swatches.forEach((btn) => {
    btn.addEventListener("click", () => {
      const color = btn.dataset.color ?? null;
      if (!color || color === state.selectedColor) return;

      state.selectedColor = color;

      // Update swatch active state
      swatches.forEach((s) => {
        s.classList.remove("active");
        s.setAttribute("aria-checked", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-checked", "true");

      // Update color name label
      if (colorNameEl) {
        colorNameEl.textContent = formatColorLabel(color);
      }

      // Filter gallery and re-render thumbs
      const filtered = galleryForColor(fullGallery, color);
      if (thumbStrip) {
        thumbStrip.innerHTML = renderThumbs(filtered);
        wireThumbs();
      }

      // Swap main image with a soft fade
      if (mainImg && filtered[0]) {
        mainImg.style.transition = "opacity 200ms ease-out";
        mainImg.style.opacity = "0.4";
        const newSrc = filtered[0].url;
        setTimeout(() => {
          mainImg.src = newSrc;
          mainImg.style.opacity = "1";
        }, 180);
      }
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