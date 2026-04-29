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
          <button class="btn-ghost" id="signout-btn" type="button"><span>Sign out</span></button>
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

// ─── Sign-out handler ───────────────────────────────────────────────────────
// We attach the listener via a delegated handler on `document` rather than
// directly on the button. Reasons:
//
//   1. The button has a `<span>` child plus an absolutely-positioned `::before`
//      pseudo-element from the `.btn-ghost` style. Clicks always bubble up to
//      the button, but the delegated handler is robust either way.
//   2. After `authStore.signOut()` resolves, Supabase fires `onAuthStateChange`
//      which triggers a global re-render. That re-render replaces the DOM and
//      can race with anything we do *after* the await. By navigating *before*
//      the await, the route change is already queued and the post-signout
//      re-render lands on the landing page rather than the empty account page.
//
// We also guard against double-attach (e.g. if initAccountPage runs twice
// because of an auth-state-change-driven re-render mid-flow).
// ────────────────────────────────────────────────────────────────────────────

let signOutHandler: ((e: Event) => void) | null = null;

function attachSignOutHandler() {
  if (signOutHandler) return; // already attached for this app session

  signOutHandler = (e: Event) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;
    const btn = target.closest("#signout-btn");
    if (!btn) return;

    e.preventDefault();

    // Navigate FIRST so the route change is queued before any auth-driven
    // re-render kicks in. Then fire-and-forget the actual sign out.
    navigate(routes.landing());

    authStore.signOut().catch((err) => {
      console.error("Sign out failed:", err);
    });
  };

  document.addEventListener("click", signOutHandler);
}

export function initAccountPage() {
  attachSignOutHandler();

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