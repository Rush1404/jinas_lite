import { Product } from "../types/product";
import { formatCurrency } from "../utils/filters";

export function renderProductGrid(products: Product[]): string {
  if (products.length === 0) {
    return `
      <div class="product-grid">
        <div class="no-results">
          <h3>No pieces found</h3>
          <p>Adjust your filters to discover more of Jina's collection.</p>
        </div>
      </div>
    `;
  }

  const cards = products
    .map(
      (product) => `
    <div class="product-card" data-product-id="${product.id}">
      <div class="product-card-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="product-card-info">
        <p class="product-card-sku">${product.sku}</p>
        <h3 class="product-card-name">${product.name}</h3>
        <p class="product-card-price">${formatCurrency(product.price)}</p>
      </div>
      <button class="product-card-btn" data-add-to-cart="${product.id}">Add to Cart</button>
    </div>
  `
    )
    .join("");

  return `<div class="product-grid">${cards}</div>`;
}

export function initProductGridEvents(
  onProductClick: (productId: string) => void
) {
  const grid = document.querySelector(".product-grid");
  if (!grid) return;

  grid.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;

    // Handle add to cart
    const addBtn = target.closest("[data-add-to-cart]") as HTMLElement;
    if (addBtn) {
      e.stopPropagation();
      const id = addBtn.dataset.addToCart!;
      console.log("Add to cart:", id);
      // TODO: cart logic
      return;
    }

    // Handle card click → open detail
    const card = target.closest(".product-card") as HTMLElement;
    if (card) {
      const id = card.dataset.productId!;
      onProductClick(id);
    }
  });
}