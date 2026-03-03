import { Product } from "../types/product";
import { formatCurrency, formatCategory } from "../utils/filters";

let currentQuantity = 1;
let selectedCarat: number | null = null;

export function renderProductDetail(
  product: Product,
  currentIndex: number,
  totalProducts: number
): string {
  selectedCarat = product.selectedCarat;
  currentQuantity = 1;

  return `
    <div class="product-detail-overlay active" id="product-detail-overlay">
      <button class="product-detail-close" id="close-detail" aria-label="Close">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
        </svg>
      </button>

      <div class="product-detail-modal">
        <!-- Image column (sticky) -->
        <div class="product-detail-image-col">
          <div class="product-detail-image">
            <img src="${product.image}" alt="${product.name}" />
          </div>
        </div>

        <!-- Content column -->
        <div class="product-detail-content">

          <!-- Header: SKU + Name + Price -->
          <div class="product-detail-header">
            <p class="product-detail-sku-label">SKU: ${product.sku}</p>
            <h2 class="product-detail-title">${product.name}</h2>
            <p class="product-detail-price">${formatCurrency(product.price)}</p>
          </div>

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

export function initProductDetailEvents(callbacks: {
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const overlay = document.getElementById("product-detail-overlay");
  if (!overlay) return;

  // Close button
  document.getElementById("close-detail")?.addEventListener("click", callbacks.onClose);

  // Escape key
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape") callbacks.onClose();
    if (e.key === "ArrowLeft") callbacks.onPrev();
    if (e.key === "ArrowRight") callbacks.onNext();
  };
  document.addEventListener("keydown", keyHandler);
  (overlay as any)._keyHandler = keyHandler;

  // Quantity controls
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

  // Carat selection
  const caratBtns = overlay.querySelectorAll<HTMLButtonElement>(".carat-option");
  caratBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      caratBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      selectedCarat = parseFloat(btn.dataset.carat!);
    });
  });

  // Nav arrows
  document.getElementById("nav-prev")?.addEventListener("click", callbacks.onPrev);
  document.getElementById("nav-next")?.addEventListener("click", callbacks.onNext);

  // Add to cart
  document.getElementById("detail-add-to-cart")?.addEventListener("click", () => {
    console.log("Add to cart:", { sku: "detail", carat: selectedCarat, quantity: currentQuantity });
  });
}

export function cleanupProductDetail() {
  const overlay = document.getElementById("product-detail-overlay");
  if (overlay && (overlay as any)._keyHandler) {
    document.removeEventListener("keydown", (overlay as any)._keyHandler);
  }
}