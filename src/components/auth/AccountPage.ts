// ─── Account Page ───────────────────────────────────────────────────────────
// Authenticated landing page for the user. Shows email, list of orders,
// sign-out button, and a link to the admin portal if the user is an admin.
// ────────────────────────────────────────────────────────────────────────────

import { authStore } from "../../lib/authStore";
import { listMyOrders } from "../../services/orderService";
import { routes, navigate } from "../../utils/router";
import { formatMoney } from "../../lib/cartStore";

export function renderAccountPage(): string {
  const { user, isAdmin } = authStore.getState();

  if (!user) {
    return `
      <section class="account-page">
        <div class="account-empty">
          <h1>Sign in required</h1>
          <p>Please sign in to see your account.</p>
          <a href="${routes.login()}" class="btn-primary"><span>Sign in</span></a>
        </div>
      </section>
    `;
  }

  return `
    <section class="account-page">
      <header class="account-header">
        <div>
          <span class="account-kicker">Your account</span>
          <h1 class="account-title">${user.email}</h1>
        </div>
        <div class="account-header-actions">
          ${isAdmin ? `<a href="${routes.admin()}" class="btn-ghost"><span>Admin portal</span></a>` : ""}
          <button class="btn-ghost" id="signout-btn"><span>Sign out</span></button>
        </div>
      </header>

      <section class="account-orders">
        <h2 class="account-section-title">Recent orders</h2>
        <div id="orders-list" class="account-orders-list">
          <p class="account-empty-msg">Loading orders…</p>
        </div>
      </section>
    </section>
  `;
}

export function initAccountPage() {
  document.getElementById("signout-btn")?.addEventListener("click", async () => {
    await authStore.signOut();
    navigate(routes.landing());
  });

  // Load orders async
  loadOrders();
}

async function loadOrders() {
  const container = document.getElementById("orders-list");
  if (!container) return;

  try {
    const orders = await listMyOrders();
    if (orders.length === 0) {
      container.innerHTML = `<p class="account-empty-msg">No orders yet.</p>`;
      return;
    }

    container.innerHTML = orders
      .map(
        (o: any) => `
        <article class="order-card">
          <div class="order-row">
            <span class="order-label">Order</span>
            <span class="order-value">#${String(o.id).slice(0, 8)}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Date</span>
            <span class="order-value">${new Date(o.created_at).toLocaleDateString()}</span>
          </div>
          <div class="order-row">
            <span class="order-label">Status</span>
            <span class="order-value order-status-${o.status}">${o.status}</span>
          </div>
          <div class="order-row order-total-row">
            <span class="order-label">Total</span>
            <span class="order-value">${formatMoney(o.total_cents)}</span>
          </div>
        </article>
      `
      )
      .join("");
  } catch (err) {
    container.innerHTML = `<p class="account-empty-msg">Couldn't load orders.</p>`;
  }
}