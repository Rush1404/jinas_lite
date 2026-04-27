// ─── Checkout Page ──────────────────────────────────────────────────────────
// Single-page checkout: shipping form on the left, order summary on the right.
// In development (no Stripe key), submit calls placeOrder() which uses the
// mock path and immediately succeeds. In production, this is where Stripe
// Elements would mount before placeOrder() is invoked.
// ────────────────────────────────────────────────────────────────────────────

import { cartStore, formatMoney } from "../../lib/cartStore";
import { authStore } from "../../lib/authStore";
import { config } from "../../lib/config";
import { placeOrder } from "../../services/orderService";
import { routes, navigate } from "../../utils/router";
import type { ShippingAddress } from "../../types/cart";

export function renderCheckoutPage(): string {
  const cart = cartStore.getCart();
  if (cart.items.length === 0) {
    return `
      <section class="checkout-page">
        <div class="cart-empty">
          <h1>Your bag is empty</h1>
          <a href="${routes.landing()}" class="btn-ghost"><span>Continue shopping</span></a>
        </div>
      </section>
    `;
  }

  const summary = cartStore.summary();
  const userEmail = authStore.getState().user?.email ?? "";

  return `
    <section class="checkout-page">
      <header class="checkout-page-header">
        <h1 class="checkout-page-title" data-reveal>Checkout</h1>
        ${
          config.stripe.isMock
            ? `<p class="checkout-mock-banner">
                <strong>Dev mode:</strong> payments are simulated — no card needed.
              </p>`
            : ""
        }
      </header>

      <div class="checkout-layout">
        <form class="checkout-form" id="checkout-form" novalidate>
          <fieldset class="checkout-fieldset">
            <legend>Contact</legend>
            <label class="checkout-field">
              <span>Email</span>
              <input type="email" name="email" required value="${userEmail}" autocomplete="email" />
            </label>
            <label class="checkout-field">
              <span>Full name</span>
              <input type="text" name="name" required autocomplete="name" />
            </label>
          </fieldset>

          <fieldset class="checkout-fieldset">
            <legend>Shipping address</legend>
            <label class="checkout-field">
              <span>Address line 1</span>
              <input type="text" name="addr1" required autocomplete="address-line1" />
            </label>
            <label class="checkout-field">
              <span>Address line 2 <em>(optional)</em></span>
              <input type="text" name="addr2" autocomplete="address-line2" />
            </label>
            <div class="checkout-row">
              <label class="checkout-field">
                <span>City</span>
                <input type="text" name="city" required autocomplete="address-level2" />
              </label>
              <label class="checkout-field">
                <span>Province / State</span>
                <input type="text" name="region" required autocomplete="address-level1" />
              </label>
            </div>
            <div class="checkout-row">
              <label class="checkout-field">
                <span>Postal code</span>
                <input type="text" name="postal" required autocomplete="postal-code" />
              </label>
              <label class="checkout-field">
                <span>Country</span>
                <input type="text" name="country" required value="Canada" autocomplete="country-name" />
              </label>
            </div>
          </fieldset>

          <fieldset class="checkout-fieldset">
            <legend>Payment</legend>
            ${
              config.stripe.isMock
                ? `<div class="checkout-mock-payment">
                    <p>Mock payment — clicking "Place order" below completes the purchase instantly. Useful for testing the flow end-to-end.</p>
                  </div>`
                : `<div id="stripe-card-element" class="checkout-stripe-mount">
                    <!-- Stripe Elements mounts here in production -->
                    <p style="font-size:12px;color:var(--smoke);">Stripe payment form loads here when configured.</p>
                  </div>`
            }
          </fieldset>

          <p class="auth-error" id="checkout-error" hidden></p>

          <button type="submit" class="btn-primary checkout-submit">
            <span data-submit-label>Place order · ${formatMoney(summary.totalCents)}</span>
          </button>
        </form>

        <aside class="checkout-summary">
          <h2 class="cart-summary-title">Order summary</h2>
          <ul class="checkout-items">
            ${cart.items
              .map(
                (item) => `
              <li class="checkout-item">
                <img src="${item.image}" alt="${item.name}" />
                <div>
                  <span class="checkout-item-name">${item.name}</span>
                  <span class="checkout-item-meta">SKU ${item.sku} · Qty ${item.quantity}</span>
                </div>
                <span class="checkout-item-price">${formatMoney(item.unitPriceCents * item.quantity)}</span>
              </li>
            `
              )
              .join("")}
          </ul>
          <dl class="cart-summary-list">
            <div><dt>Subtotal</dt><dd>${formatMoney(summary.subtotalCents)}</dd></div>
            <div><dt>Shipping</dt><dd>${formatMoney(summary.shippingCents)}</dd></div>
            <div><dt>Tax</dt><dd>${formatMoney(summary.taxCents)}</dd></div>
            <div class="cart-summary-total"><dt>Total</dt><dd>${formatMoney(summary.totalCents)}</dd></div>
          </dl>
        </aside>
      </div>
    </section>
  `;
}

export function initCheckoutPage() {
  const form = document.getElementById("checkout-form") as HTMLFormElement | null;
  const errorEl = document.getElementById("checkout-error") as HTMLParagraphElement | null;
  const submitLabel = document.querySelector("[data-submit-label]") as HTMLElement | null;
  if (!form || !errorEl || !submitLabel) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const data = new FormData(form);
    const shipping: ShippingAddress = {
      email: String(data.get("email") || "").trim(),
      name: String(data.get("name") || "").trim(),
      addr1: String(data.get("addr1") || "").trim(),
      addr2: String(data.get("addr2") || "").trim() || undefined,
      city: String(data.get("city") || "").trim(),
      region: String(data.get("region") || "").trim(),
      postal: String(data.get("postal") || "").trim(),
      country: String(data.get("country") || "").trim(),
    };

    if (!shipping.email || !shipping.name || !shipping.addr1 || !shipping.city) {
      errorEl.textContent = "Please fill in all required fields.";
      errorEl.hidden = false;
      return;
    }

    const original = submitLabel.textContent;
    submitLabel.textContent = "Placing order…";
    (form.querySelector("button[type=submit]") as HTMLButtonElement).disabled = true;

    try {
      const result = await placeOrder(shipping);
      navigate(routes.orderSuccess(result.orderId));
    } catch (err: any) {
      errorEl.textContent = err?.message ?? "Order failed";
      errorEl.hidden = false;
      submitLabel.textContent = original;
      (form.querySelector("button[type=submit]") as HTMLButtonElement).disabled = false;
    }
  });
}

// ─── Order Success Page ─────────────────────────────────────────────────────
export function renderOrderSuccessPage(orderId: string): string {
  return `
    <section class="checkout-page">
      <div class="order-success">
        <span class="account-kicker">Confirmed</span>
        <h1 class="checkout-page-title">Thank you.</h1>
        <p>Your order has been placed. We've sent a confirmation to your email.</p>
        <p class="order-success-id">Order #${orderId.slice(0, 8)}</p>
        <div class="order-success-actions">
          <a href="${routes.account()}" class="btn-primary"><span>View my orders</span></a>
          <a href="${routes.landing()}" class="btn-ghost"><span>Continue shopping</span></a>
        </div>
      </div>
    </section>
  `;
}