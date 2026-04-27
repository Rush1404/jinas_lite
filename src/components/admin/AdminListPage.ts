// ─── Admin Portal ───────────────────────────────────────────────────────────
// Two views: a password gate, and the actual portal.
//   - Gate:    asks for the soft admin password (config.admin.password)
//   - Portal:  list of all products with edit / new / delete actions
//
// Real DB security comes from RLS. Even with the gate unlocked, writes
// only succeed when the user is in the `admins` table OR Supabase is
// not configured (dev mode, where adminService falls back to mockProducts).
// ────────────────────────────────────────────────────────────────────────────

import { isAdminUnlocked, unlockAdmin, lockAdmin } from "../../lib/adminGate";
import { listAllProducts, deleteProduct } from "../../services/adminService";
import { routes, navigate } from "../../utils/router";
import { formatCurrency, formatSubCategory } from "../../utils/filters";
import type { Product } from "../../types/product";

// ─── Gate UI ────────────────────────────────────────────────────────────────
function renderGate(): string {
  return `
    <section class="admin-gate">
      <div class="auth-card">
        <h1 class="auth-title" data-reveal>Admin portal</h1>
        <p class="auth-sub" data-reveal>Enter the password to manage the catalog.</p>
        <form class="auth-form" id="admin-gate-form" novalidate>
          <label class="auth-field">
            <span>Password</span>
            <input type="password" name="password" required autocomplete="off" autofocus />
          </label>
          <p class="auth-error" id="admin-gate-error" hidden></p>
          <button type="submit" class="auth-submit"><span>Unlock</span></button>
        </form>
      </div>
    </section>
  `;
}

function initGate() {
  const form = document.getElementById("admin-gate-form") as HTMLFormElement | null;
  const errorEl = document.getElementById("admin-gate-error");
  if (!form || !errorEl) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const ok = unlockAdmin(String(data.get("password") || ""));
    if (ok) {
      // Re-render this page now that we're unlocked.
      window.location.hash = routes.admin();
      window.location.reload();
    } else {
      errorEl.textContent = "Incorrect password.";
      errorEl.hidden = false;
    }
  });
}

// ─── List view ──────────────────────────────────────────────────────────────
function renderList(products: Product[]): string {
  return `
    <section class="admin-page">
      <header class="admin-header">
        <div>
          <span class="account-kicker">Catalog manager</span>
          <h1 class="admin-title">Products</h1>
        </div>
        <div class="admin-header-actions">
          <a href="${routes.adminNew()}" class="btn-primary"><span>+ New product</span></a>
          <button class="btn-ghost" id="admin-lock-btn"><span>Lock</span></button>
        </div>
      </header>

      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th></th>
              <th>SKU</th>
              <th>Name</th>
              <th>Category</th>
              <th>For</th>
              <th>Price</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${
              products.length === 0
                ? `<tr><td colspan="8" class="admin-empty">No products yet. Click "New product" to add one.</td></tr>`
                : products.map(renderRow).join("")
            }
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderRow(product: Product): string {
  return `
    <tr data-product-id="${product.id}">
      <td>
        <img src="${product.image}" alt="${product.name}" class="admin-thumb"
             onerror="this.style.background='var(--paper)'; this.removeAttribute('src');" />
      </td>
      <td><code>${product.sku}</code></td>
      <td>${product.name}</td>
      <td>${formatSubCategory(product.subCategory)}</td>
      <td>${product.gender ?? "WOMEN"}</td>
      <td>${formatCurrency(product.price)}</td>
      <td>
        <span class="admin-status ${product.isActive === false ? "inactive" : "active"}">
          ${product.isActive === false ? "Hidden" : "Live"}
        </span>
      </td>
      <td class="admin-row-actions">
        <a href="${routes.adminEdit(product.sku)}" class="admin-action-btn">Edit</a>
        <button class="admin-action-btn admin-action-danger" data-delete="${product.id}">Delete</button>
      </td>
    </tr>
  `;
}

// ─── Top-level dispatch ─────────────────────────────────────────────────────
export function renderAdminListPage(): string {
  if (!isAdminUnlocked()) return renderGate();
  return `
    <section class="admin-page">
      <div id="admin-list-mount">
        <p class="admin-loading">Loading products…</p>
      </div>
    </section>
  `;
}

export async function initAdminListPage() {
  if (!isAdminUnlocked()) {
    initGate();
    return;
  }

  const mount = document.getElementById("admin-list-mount");
  if (!mount) return;

  try {
    const products = await listAllProducts();
    mount.outerHTML = renderList(products);
  } catch (err: any) {
    mount.innerHTML = `<p class="auth-error">Failed to load products: ${err?.message}</p>`;
    return;
  }

  // Wire actions
  document.getElementById("admin-lock-btn")?.addEventListener("click", () => {
    lockAdmin();
    navigate(routes.landing());
  });

  document.querySelectorAll<HTMLButtonElement>("[data-delete]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.delete;
      if (!id) return;
      const ok = confirm("Hide this product from the storefront? Existing orders are unaffected.");
      if (!ok) return;
      try {
        await deleteProduct(id);
        // Re-fetch and re-render
        const products = await listAllProducts();
        const tbody = document.querySelector(".admin-table tbody");
        if (tbody) tbody.innerHTML = products.map(renderRow).join("");
        // Rewire delete buttons (since innerHTML replaced them)
        initAdminListPage();
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    });
  });
}