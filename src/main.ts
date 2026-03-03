import "./styles/main.css";
import { mockProducts } from "./data/products.ts";
import { Product, FilterState, defaultFilterState } from "./types/product.ts";
import { filterProducts } from "./utils/filters.ts";
import { renderHeader } from "./components/Header.ts";
import {
  renderFilters,
  initFilterEvents,
  setFilterChangeCallback,
} from "./components/Filters.ts";
import { renderProductGrid, initProductGridEvents } from "./components/ProductGrid.ts";
import {
  renderProductDetail,
  initProductDetailEvents,
  cleanupProductDetail,
} from "./components/ProductDetail.ts";

// ——— State ———
let filteredProducts: Product[] = [...mockProducts];
let activeProductIndex: number | null = null;

// ——— DOM ———
const app = document.querySelector<HTMLDivElement>("#app")!;

function render() {
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

// ——— Filter handling ———
setFilterChangeCallback((filters: FilterState) => {
  filteredProducts = filterProducts(mockProducts, filters);
  const gridContainer = document.getElementById("product-grid-container");
  if (gridContainer) {
    gridContainer.innerHTML = renderProductGrid(filteredProducts);
    initProductGridEvents(openProductDetail);
  }
});

// ——— Product detail ———
function openProductDetail(productId: string) {
  const idx = filteredProducts.findIndex((p) => p.id === productId);
  if (idx === -1) return;
  activeProductIndex = idx;
  renderDetail();
}

function renderDetail() {
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

  // Prevent body scroll
  document.body.style.overflow = "hidden";

  initProductDetailEvents({
    onClose: closeDetail,
    onPrev: () => navigateProduct(-1),
    onNext: () => navigateProduct(1),
  });
}

function closeDetail() {
  cleanupProductDetail();
  const container = document.getElementById("product-detail-container");
  if (container) container.innerHTML = "";
  activeProductIndex = null;
  document.body.style.overflow = "";
}

function navigateProduct(direction: number) {
  if (activeProductIndex === null) return;
  const newIndex = activeProductIndex + direction;
  if (newIndex < 0 || newIndex >= filteredProducts.length) return;
  activeProductIndex = newIndex;
  cleanupProductDetail();
  renderDetail();
}

// ——— Init ———
render();