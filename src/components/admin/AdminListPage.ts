// ─── Admin Portal ───────────────────────────────────────────────────────────
// Two views: a password gate, and the actual portal.
//   - Gate:    asks for the soft admin password (config.admin.password)
//   - Portal:  list of all products with edit / new / delete actions,
//              plus a "Featured" panel for picking the up-to-six pieces
//              showcased on the landing page.
//
// Real DB security comes from RLS. Even with the gate unlocked, writes
// only succeed when the user is in the `admins` table OR Supabase is
// not configured (dev mode, where adminService falls back to mockProducts).
// ────────────────────────────────────────────────────────────────────────────

import { isAdminUnlocked, unlockAdmin, lockAdmin } from "../../lib/adminGate";
import { listAllProducts, deleteProduct } from "../../services/adminService";
import {
  getFeaturedSkus,
  addFeaturedSku,
  removeFeaturedSku,
  reorderFeaturedSkus,
  MAX_FEATURED,
} from "../../services/featuredService";
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
      window.location.hash = routes.admin();
      window.location.reload();
    } else {
      errorEl.textContent = "Incorrect password.";
      errorEl.hidden = false;
    }
  });
}

// ─── Featured panel ─────────────────────────────────────────────────────────
//
// Shows up to six picked pieces as thumbnail tiles. Empty slots render
// as "+" tiles that open a picker overlay listing every active product.
// Picks reorder by dragging tiles. Saving is automatic on every change.

function renderFeaturedPanel(allProducts: Product[]): string {
  const skus = getFeaturedSkus();
  const bySku = new Map<string, Product>();
  for (const p of allProducts) bySku.set(p.sku.toUpperCase(), p);

  // Resolve to products in saved order. If a stored SKU no longer
  // exists (deleted), it gets skipped — show a stale-pick warning.
  const picks: Product[] = [];
  let staleCount = 0;
  for (const sku of skus) {
    const product = bySku.get(sku.toUpperCase());
    if (product) picks.push(product);
    else staleCount++;
  }

  // Build the slot strip: filled tiles for picks, "+" tiles for empties.
  const slots: string[] = [];
  picks.forEach((p, i) => {
    slots.push(renderFeaturedTile(p, i));
  });
  for (let i = picks.length; i < MAX_FEATURED; i++) {
    slots.push(renderEmptyTile(i));
  }

  return `
    <section class="featured-panel" data-featured-panel>
      <header class="featured-panel-header">
        <div>
          <span class="account-kicker">Landing page</span>
          <h2 class="featured-panel-title">Featured edit</h2>
          <p class="featured-panel-hint">
            Pick up to ${MAX_FEATURED} pieces to showcase in
            <em>"The edit, picked by Jina"</em> on the home page.
            Drag tiles to reorder.
          </p>
        </div>
        <div class="featured-panel-meta">
          <span class="featured-panel-count">
            ${picks.length} / ${MAX_FEATURED}
          </span>
          ${
            staleCount > 0
              ? `<span class="featured-panel-warning">
                  ${staleCount} pick${staleCount === 1 ? "" : "s"} no longer in catalog — auto-removed
                </span>`
              : ""
          }
        </div>
      </header>

      <div class="featured-slots" data-featured-slots>
        ${slots.join("")}
      </div>
    </section>

    <!-- Picker overlay (hidden by default) -->
    <div class="featured-picker" data-featured-picker hidden>
      <div class="featured-picker-backdrop" data-featured-picker-close></div>
      <div class="featured-picker-card" role="dialog" aria-label="Choose a product to feature">
        <header class="featured-picker-header">
          <div>
            <h3>Add to featured</h3>
            <p class="featured-picker-sub">Tap a piece to feature it on the landing page.</p>
          </div>
          <button class="featured-picker-close" type="button" data-featured-picker-close aria-label="Close">×</button>
        </header>
        <input
          type="search"
          class="featured-picker-search"
          placeholder="Search by SKU or name…"
          data-featured-search
          autocomplete="off"
        />
        <div class="featured-picker-list" data-featured-picker-list>
          ${renderPickerRows(allProducts, getFeaturedSkus())}
        </div>
      </div>
    </div>
  `;
}

function renderFeaturedTile(product: Product, index: number): string {
  return `
    <div
      class="featured-slot featured-slot-filled"
      data-featured-slot
      data-sku="${product.sku}"
      data-index="${index}"
      draggable="true"
    >
      <div class="featured-slot-image">
        <img src="${product.image}" alt="${product.name}" loading="lazy" />
      </div>
      <div class="featured-slot-info">
        <span class="featured-slot-name">${product.name}</span>
        <span class="featured-slot-sku">${product.sku}</span>
      </div>
      <button
        type="button"
        class="featured-slot-remove"
        data-featured-remove="${product.sku}"
        aria-label="Remove ${product.name} from featured"
        title="Remove"
      >×</button>
      <span class="featured-slot-pos">${index + 1}</span>
    </div>
  `;
}

function renderEmptyTile(index: number): string {
  return `
    <button
      type="button"
      class="featured-slot featured-slot-empty"
      data-featured-add
      aria-label="Add a featured product"
    >
      <span class="featured-slot-plus">+</span>
      <span class="featured-slot-empty-label">Pick a piece</span>
      <span class="featured-slot-pos">${index + 1}</span>
    </button>
  `;
}

function renderPickerRows(allProducts: Product[], featuredSkus: string[]): string {
  const featured = new Set(featuredSkus.map((s) => s.toUpperCase()));
  const isFull = featuredSkus.length >= MAX_FEATURED;

  // Show active products first, then sort alphabetically by SKU.
  const sorted = [...allProducts]
    .filter((p) => p.isActive !== false)
    .sort((a, b) => a.sku.localeCompare(b.sku));

  if (sorted.length === 0) {
    return `<p class="featured-picker-empty">No active products yet. Add one first.</p>`;
  }

  return sorted
    .map((p) => {
      const already = featured.has(p.sku.toUpperCase());
      const disabled = already || (isFull && !already);
      return `
        <button
          type="button"
          class="featured-picker-row ${already ? "is-featured" : ""}"
          data-featured-pick="${p.sku}"
          data-search-text="${(p.sku + " " + p.name).toLowerCase()}"
          ${disabled ? "disabled" : ""}
        >
          <img src="${p.image}" alt="" class="featured-picker-thumb" />
          <span class="featured-picker-name">${p.name}</span>
          <span class="featured-picker-sku">${p.sku}</span>
          <span class="featured-picker-price">${formatCurrency(p.price)}</span>
          <span class="featured-picker-state">
            ${
              already
                ? "Featured"
                : isFull
                ? `Full (${MAX_FEATURED}/${MAX_FEATURED})`
                : "Add"
            }
          </span>
        </button>
      `;
    })
    .join("");
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

      ${renderFeaturedPanel(products)}

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

  let products: Product[];
  try {
    products = await listAllProducts();
    mount.outerHTML = renderList(products);
  } catch (err: any) {
    mount.innerHTML = `<p class="auth-error">Failed to load products: ${err?.message}</p>`;
    return;
  }

  // ── Wire actions ──────────────────────────────────────────────────────
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
        const fresh = await listAllProducts();
        const tbody = document.querySelector(".admin-table tbody");
        if (tbody) tbody.innerHTML = fresh.map(renderRow).join("");
        // The featured panel may have stale references — refresh it too.
        wireFeaturedPanel(fresh);
        // Rewire delete buttons (innerHTML replaced them).
        initAdminListPage();
      } catch (err: any) {
        alert("Delete failed: " + err.message);
      }
    });
  });

  wireFeaturedPanel(products);
}

// ─── Featured panel wiring ──────────────────────────────────────────────────
//
// All featured-panel listeners are attached to the wrapping section via
// event delegation, so a single re-render of the panel's innerHTML
// works without leaking handlers.

function wireFeaturedPanel(allProducts: Product[]) {
  const panel = document.querySelector<HTMLElement>("[data-featured-panel]");
  if (!panel) return;

  // ── Click delegation on document: + tiles, × removes, picker close ────
  // (Both wireFeaturedPanel and rerenderPanel handle their own cleanup of
  // these handlers — see the removeEventListener calls in rerenderPanel.)
  document.addEventListener("click", onFeaturedClick);

  // ── Search filtering inside the picker ────────────────────────────────
  document.addEventListener("input", onFeaturedSearch);

  // ── Drag-and-drop reordering (panel-scoped, so re-rendering the panel
  // inherently disposes these handlers — no manual cleanup needed) ──────
  attachDragHandlers();

  function onFeaturedClick(e: MouseEvent) {
    const target = e.target as HTMLElement;

    // Open picker (any "+" empty slot)
    if (target.closest("[data-featured-add]")) {
      openPicker();
      return;
    }

    // Close picker (×, backdrop, or close button)
    if (target.closest("[data-featured-picker-close]")) {
      closePicker();
      return;
    }

    // Remove a featured pick (× on a filled tile)
    const removeBtn = target.closest<HTMLElement>("[data-featured-remove]");
    if (removeBtn) {
      e.preventDefault();
      e.stopPropagation();
      const sku = removeBtn.dataset.featuredRemove!;
      removeFeaturedSku(sku);
      rerenderPanel();
      return;
    }

    // Pick a product from the picker list
    const pickBtn = target.closest<HTMLButtonElement>("[data-featured-pick]");
    if (pickBtn && !pickBtn.disabled) {
      const sku = pickBtn.dataset.featuredPick!;
      addFeaturedSku(sku);
      closePicker();
      rerenderPanel();
      return;
    }
  }

  function onFeaturedSearch(e: Event) {
    const target = e.target as HTMLInputElement;
    if (!target.matches("[data-featured-search]")) return;
    const q = target.value.trim().toLowerCase();
    document
      .querySelectorAll<HTMLElement>("[data-featured-pick]")
      .forEach((row) => {
        const text = row.dataset.searchText ?? "";
        row.style.display = !q || text.includes(q) ? "" : "none";
      });
  }

  function openPicker() {
    const picker = document.querySelector<HTMLElement>("[data-featured-picker]");
    if (!picker) return;
    picker.hidden = false;
    void picker.offsetWidth; // force reflow for transition
    picker.classList.add("is-open");
    // Focus the search field for fast typing
    const search = picker.querySelector<HTMLInputElement>("[data-featured-search]");
    if (search) {
      search.value = "";
      search.focus();
      // Clear any stale display:none from a previous filter
      picker
        .querySelectorAll<HTMLElement>("[data-featured-pick]")
        .forEach((r) => (r.style.display = ""));
    }
  }

  function closePicker() {
    const picker = document.querySelector<HTMLElement>("[data-featured-picker]");
    if (!picker) return;
    picker.classList.remove("is-open");
    window.setTimeout(() => {
      if (!picker.classList.contains("is-open")) picker.hidden = true;
    }, 200);
  }

  function rerenderPanel() {
    const wrap = document.querySelector<HTMLElement>("[data-featured-panel]");
    const oldPickerEl = document.querySelector<HTMLElement>("[data-featured-picker]");
    if (!wrap) return;

    // The renderFeaturedPanel function emits BOTH the panel and the picker
    // overlay as siblings in one HTML string. We need to swap both atomically.
    const tempContainer = document.createElement("div");
    tempContainer.innerHTML = renderFeaturedPanel(allProducts);
    const newPanel = tempContainer.querySelector<HTMLElement>("[data-featured-panel]");
    const newPicker = tempContainer.querySelector<HTMLElement>("[data-featured-picker]");

    if (newPanel) wrap.replaceWith(newPanel);
    if (newPicker && oldPickerEl) oldPickerEl.replaceWith(newPicker);

    // Clean up listeners and re-wire — the cloned panel doesn't have them.
    document.removeEventListener("click", onFeaturedClick);
    document.removeEventListener("input", onFeaturedSearch);
    wireFeaturedPanel(allProducts);
  }

  // ── Drag and drop ─────────────────────────────────────────────────────
  function attachDragHandlers() {
    const slotsContainer = document.querySelector<HTMLElement>("[data-featured-slots]");
    if (!slotsContainer) return;

    let draggedIdx: number | null = null;

    slotsContainer.addEventListener("dragstart", (e) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-featured-slot]"
      );
      if (!tile) return;
      draggedIdx = parseInt(tile.dataset.index ?? "-1", 10);
      tile.classList.add("is-dragging");
      // Some browsers require setData to actually start a drag
      e.dataTransfer?.setData("text/plain", String(draggedIdx));
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });

    slotsContainer.addEventListener("dragend", (e) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-featured-slot]"
      );
      tile?.classList.remove("is-dragging");
      slotsContainer
        .querySelectorAll(".is-drop-target")
        .forEach((el) => el.classList.remove("is-drop-target"));
      draggedIdx = null;
    });

    slotsContainer.addEventListener("dragover", (e) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-featured-slot]"
      );
      if (!tile || draggedIdx === null) return;
      e.preventDefault();
      slotsContainer
        .querySelectorAll(".is-drop-target")
        .forEach((el) => el.classList.remove("is-drop-target"));
      tile.classList.add("is-drop-target");
    });

    slotsContainer.addEventListener("drop", (e) => {
      const tile = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-featured-slot]"
      );
      if (!tile || draggedIdx === null) return;
      e.preventDefault();
      const targetIdx = parseInt(tile.dataset.index ?? "-1", 10);
      if (targetIdx < 0 || targetIdx === draggedIdx) return;
      reorderFeaturedSkus(draggedIdx, targetIdx);
      draggedIdx = null;
      rerenderPanel();
    });
  }
}