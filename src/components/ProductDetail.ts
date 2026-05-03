import {
  type Product,
  type GalleryImage,
  availableColors,
  galleryForColor,
} from "../types/product";
import { formatCurrency, formatCategory } from "../utils/filters";

let currentQuantity = 1;
let selectedCarat: number | null = null;
let selectedColor: string | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Renders the thumbnail strip for a given gallery slice. */
function renderThumbs(gallery: GalleryImage[], activeIndex: number = 0): string {
  if (gallery.length <= 1) return "";
  return gallery
    .map(
      (g, i) => `
      <button
        class="detail-thumb ${i === activeIndex ? "active" : ""}"
        data-thumb-index="${i}"
        data-thumb-url="${g.url}"
        aria-label="View image ${i + 1}"
      >
        <img src="${g.url}" alt="Product view ${i + 1}" loading="lazy" />
      </button>
    `
    )
    .join("");
}

function getGallery(product: Product): GalleryImage[] {
  if (product.gallery && product.gallery.length > 0) return product.gallery;
  return [{ url: product.image, color: null }];
}

// ─── Render ───────────────────────────────────────────────────────────────────

export function renderProductDetail(
  product: Product,
  currentIndex: number,
  totalProducts: number
): string {
  selectedCarat = product.selectedCarat;
  currentQuantity = 1;

  const fullGallery = getGallery(product);
  const colors = availableColors(fullGallery);
  selectedColor = colors[0] ?? null;

  // Initial slice for the default color (or full gallery if untagged)
  const initialGallery = galleryForColor(fullGallery, selectedColor);
  const heroImage = initialGallery[0]?.url ?? product.image;

  // Encode the FULL gallery so the swatch handler can re-filter on click
  const fullGalleryAttr = encodeURIComponent(JSON.stringify(fullGallery));

  return `
    <div class="product-detail-overlay active" id="product-detail-overlay">
      <button class="product-detail-close" id="close-detail" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="product-detail-modal">

        <!-- ── Image column (sticky) ── -->
        <div class="product-detail-image-col" data-full-gallery="${fullGalleryAttr}">

          <!-- Main image -->
          <div class="product-detail-image">
            <img
              id="detail-main-image"
              src="${heroImage}"
              alt="${product.name}"
            />
          </div>

          <!-- Thumbnail strip — replaced wholesale on color change -->
          <div class="detail-thumbs" id="detail-thumbs">
            ${renderThumbs(initialGallery, 0)}
          </div>

        </div>

        <!-- ── Content column ── -->
        <div class="product-detail-content">

          <!-- Header: SKU + Name + Price -->
          <div class="product-detail-header">
            <p class="product-detail-sku-label">SKU: ${product.sku}</p>
            <h2 class="product-detail-title">${product.name}</h2>
            <p class="product-detail-price">${formatCurrency(product.price)}</p>
          </div>

          <!-- Color Options -->
          ${
            colors.length > 0
              ? `
            <div class="detail-section">
              <p class="detail-section-label">Color</p>
              <div class="color-options">
                ${colors
                  .map(
                    (color) => `
                  <button
                    class="color-option ${color === selectedColor ? "active" : ""}"
                    data-color="${color}"
                  >
                    ${color}
                  </button>
                `
                  )
                  .join("")}
              </div>
            </div>
          `
              : ""
          }

          <!-- Carat Options -->
          <div class="detail-section">
            <p class="detail-section-label">Available Diamond Carat (${product.diamondCaratOptions.length})</p>
            <div class="carat-options">
              ${product.diamondCaratOptions
                .map(
                  (c) => `
                <button class="carat-option ${c === selectedCarat ? "active" : ""}" data-carat="${c}">
                  ${c.toFixed(2)} Ct
                </button>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Quantity + Add to Cart -->
          <div class="detail-section">
            <p class="detail-section-label">Quantity</p>
            <div class="detail-actions">
              <div class="quantity-control">
                <button class="quantity-btn" id="qty-minus">&minus;</button>
                <span class="quantity-value" id="qty-value">${currentQuantity}</span>
                <button class="quantity-btn" id="qty-plus">+</button>
              </div>
              <button class="add-to-cart-btn" id="detail-add-to-cart">Add to Cart</button>
            </div>
          </div>

          <!-- Specifications -->
          <div class="detail-section">
            <p class="detail-section-label">Specifications</p>
            <div class="product-specs">
              <div class="spec-item">
                <span class="spec-label">Gold Wt 18k (gm)</span>
                <span class="spec-value">${product.goldWt18k}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Gold Wt 14k (gm)</span>
                <span class="spec-value">${product.goldWt14k}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Diamond Wt (ct)</span>
                <span class="spec-value">${product.diamondWt}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Category</span>
                <span class="spec-value">${formatCategory(product.category)}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Silver 925</span>
                <span class="spec-value">${product.silver925}</span>
              </div>
              <div class="spec-item">
                <span class="spec-label">Size</span>
                <span class="spec-value">${product.size} Ct</span>
              </div>
            </div>
          </div>

          <!-- Navigation -->
          <div class="product-nav-row">
            <span class="product-nav-counter">${currentIndex + 1} of ${totalProducts}</span>
            <div class="product-nav-arrows">
              <button class="product-nav-arrow" id="nav-prev" ${currentIndex === 0 ? "disabled" : ""} aria-label="Previous product">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
                </svg>
              </button>
              <button class="product-nav-arrow" id="nav-next" ${currentIndex >= totalProducts - 1 ? "disabled" : ""} aria-label="Next product">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `;
}

// ─── Events ───────────────────────────────────────────────────────────────────

export function initProductDetailEvents(callbacks: {
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const overlay = document.getElementById("product-detail-overlay");
  if (!overlay) return;

  const imageCol = overlay.querySelector<HTMLElement>(".product-detail-image-col");
  const mainImage = document.getElementById("detail-main-image") as HTMLImageElement;
  const thumbsContainer = document.getElementById("detail-thumbs") as HTMLDivElement;

  // Read the full gallery off the DOM
  let fullGallery: GalleryImage[] = [];
  try {
    const raw = imageCol?.dataset.fullGallery;
    if (raw) fullGallery = JSON.parse(decodeURIComponent(raw));
  } catch (e) {
    console.error("Failed to parse full gallery", e);
  }

  // ── Helpers ──────────────────────────────────────────────────────────────

  /** Swap the main image with a fade, update active thumb. */
  function setMainImage(url: string, activeThumbIndex: number) {
    mainImage.style.opacity = "0";
    mainImage.style.transform = "scale(1.015)";
    setTimeout(() => {
      mainImage.src = url;
      mainImage.style.opacity = "1";
      mainImage.style.transform = "scale(1)";
    }, 140);

    thumbsContainer
      .querySelectorAll<HTMLButtonElement>(".detail-thumb")
      .forEach((t, i) => t.classList.toggle("active", i === activeThumbIndex));
  }

  /** Replace the entire thumbnail strip and set a new hero image. */
  function setColorGallery(gallery: GalleryImage[]) {
    thumbsContainer.innerHTML = renderThumbs(gallery, 0);

    if (gallery.length > 0) {
      mainImage.style.opacity = "0";
      mainImage.style.transform = "scale(1.015)";
      setTimeout(() => {
        mainImage.src = gallery[0].url;
        mainImage.style.opacity = "1";
        mainImage.style.transform = "scale(1)";
      }, 140);
    }

    bindThumbEvents();
  }

  /** Attach click handlers to the current set of thumbnail buttons. */
  function bindThumbEvents() {
    thumbsContainer
      .querySelectorAll<HTMLButtonElement>(".detail-thumb")
      .forEach((btn) => {
        btn.addEventListener("click", () => {
          const idx = parseInt(btn.dataset.thumbIndex!, 10);
          const url = btn.dataset.thumbUrl!;
          setMainImage(url, idx);
        });
      });
  }

  // ── Close / keyboard ────────────────────────────────────────────────────

  document.getElementById("close-detail")?.addEventListener("click", callbacks.onClose);

  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") callbacks.onClose();
    if (e.key === "ArrowLeft") callbacks.onPrev();
    if (e.key === "ArrowRight") callbacks.onNext();
  };
  document.addEventListener("keydown", keyHandler);
  (overlay as any)._keyHandler = keyHandler;

  // ── Quantity ─────────────────────────────────────────────────────────────

  const qtyMinus = document.getElementById("qty-minus");
  const qtyPlus = document.getElementById("qty-plus");
  const qtyValue = document.getElementById("qty-value");

  qtyMinus?.addEventListener("click", () => {
    if (currentQuantity > 1) {
      currentQuantity--;
      if (qtyValue) qtyValue.textContent = currentQuantity.toString();
    }
  });

  qtyPlus?.addEventListener("click", () => {
    currentQuantity++;
    if (qtyValue) qtyValue.textContent = currentQuantity.toString();
  });

  // ── Carat selection ──────────────────────────────────────────────────────

  const caratBtns = overlay.querySelectorAll<HTMLButtonElement>(".carat-option");
  caratBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      caratBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCarat = parseFloat(btn.dataset.carat!);
    });
  });

  // ── Color selection → filtered gallery swap ──────────────────────────────

  const colorBtns = overlay.querySelectorAll<HTMLButtonElement>(".color-option");

  colorBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const newColor = btn.dataset.color!;
      if (newColor === selectedColor) return;

      colorBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedColor = newColor;

      const filtered = galleryForColor(fullGallery, newColor);
      setColorGallery(filtered);
    });
  });

  // ── Initial thumb binding ────────────────────────────────────────────────
  bindThumbEvents();

  // ── Nav arrows ────────────────────────────────────────────────────────────

  document.getElementById("nav-prev")?.addEventListener("click", callbacks.onPrev);
  document.getElementById("nav-next")?.addEventListener("click", callbacks.onNext);

  // ── Add to cart ───────────────────────────────────────────────────────────

  document.getElementById("detail-add-to-cart")?.addEventListener("click", () => {
    console.log("Add to cart:", {
      sku: "detail",
      carat: selectedCarat,
      color: selectedColor,
      quantity: currentQuantity,
    });
  });
}

export function cleanupProductDetail() {
  const overlay = document.getElementById("product-detail-overlay");
  if (overlay && (overlay as any)._keyHandler) {
    document.removeEventListener("keydown", (overlay as any)._keyHandler);
  }
}