// ─── Cart Page ──────────────────────────────────────────────────────────────
// Shows current cart with quantity controls and a summary block.
// Subscribes to cartStore so it re-renders on any change.
// ────────────────────────────────────────────────────────────────────────────

import { cartStore, formatMoney } from "../../lib/cartStore";
import { routes } from "../../utils/router";
import type { Cart } from "../../types/cart";

export function renderCartPage(): string {
  return `
    <section class="cart-page">
      <header class="cart-page-header">
        <h1 class="cart-page-title" data-reveal>Your bag</h1>
      </header>

      <div class="cart-layout">
        <div class="cart-items" id="cart-items">
          ${renderItemsList(cartStore.getCart())}
        </div>

        <aside class="cart-summary" id="cart-summary">
          ${renderSummary()}
        </aside>
      </div>
    </section>
  `;
}

function renderItemsList(cart: Cart): string {
  if (cart.items.length === 0) {
    return `
      <div class="cart-empty">
        <p>Your bag is empty.</p>
        <a href="${routes.landing()}" class="btn-ghost"><span>Continue shopping</span></a>
      </div>
    `;
  }

  return cart.items
    .map(
      (item) => `
      <article class="cart-item" data-sku="${item.sku}">
        <a href="${routes.product(item.sku)}" class="cart-item-image">
          <img src="${item.image}" alt="${item.name}" />
        </a>
        <div class="cart-item-body">
          <a href="${routes.product(item.sku)}" class="cart-item-name">${item.name}</a>
          <span class="cart-item-sku">SKU ${item.sku}</span>
          <div class="cart-item-controls">
            <div class="cart-qty">
              <button class="cart-qty-btn" data-qty-action="dec" data-sku="${item.sku}" aria-label="Decrease quantity">−</button>
              <span class="cart-qty-value">${item.quantity}</span>
              <button class="cart-qty-btn" data-qty-action="inc" data-sku="${item.sku}" aria-label="Increase quantity">+</button>
            </div>
            <button class="cart-remove" data-remove="${item.sku}">Remove</button>
          </div>
        </div>
        <div class="cart-item-price">
          ${formatMoney(item.unitPriceCents * item.quantity)}
        </div>
      </article>
    `
    )
    .join("");
}

function renderSummary(): string {
  const summary = cartStore.summary();
  const empty = cartStore.itemCount() === 0;

  return `
    <h2 class="cart-summary-title">Summary</h2>
    <dl class="cart-summary-list">
      <div><dt>Subtotal</dt><dd>${formatMoney(summary.subtotalCents)}</dd></div>
      <div><dt>Shipping</dt><dd>${empty ? "—" : formatMoney(summary.shippingCents)}</dd></div>
      <div><dt>Tax</dt><dd>${formatMoney(summary.taxCents)}</dd></div>
      <div class="cart-summary-total"><dt>Total</dt><dd>${formatMoney(summary.totalCents)}</dd></div>
    </dl>
    <a
      href="${routes.checkout()}"
      class="btn-primary cart-checkout-btn ${empty ? "disabled" : ""}"
      ${empty ? 'aria-disabled="true" tabindex="-1"' : ""}
    >
      <span>Checkout</span>
    </a>
    <p class="cart-summary-aside">Tax estimated. Free returns within 30 days.</p>
  `;
}

let unsubscribe: (() => void) | null = null;

export function initCartPage() {
  const itemsContainer = document.getElementById("cart-items");
  const summaryContainer = document.getElementById("cart-summary");
  if (!itemsContainer || !summaryContainer) return;

  const rerender = (cart: Cart) => {
    itemsContainer.innerHTML = renderItemsList(cart);
    summaryContainer.innerHTML = renderSummary();
  };

  unsubscribe = cartStore.subscribe(rerender);

  // Delegated event handler for qty / remove
  itemsContainer.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    const qtyBtn = target.closest<HTMLElement>("[data-qty-action]");
    const removeBtn = target.closest<HTMLElement>("[data-remove]");

    if (qtyBtn) {
      const sku = qtyBtn.dataset.sku;
      const action = qtyBtn.dataset.qtyAction;
      if (!sku) return;
      const item = cartStore.getCart().items.find((i) => i.sku === sku);
      if (!item) return;
      cartStore.setQuantity(sku, action === "inc" ? item.quantity + 1 : item.quantity - 1);
    }

    if (removeBtn) {
      const sku = removeBtn.dataset.remove;
      if (sku) cartStore.remove(sku);
    }
  });
}

export function cleanupCartPage() {
  unsubscribe?.();
  unsubscribe = null;
}