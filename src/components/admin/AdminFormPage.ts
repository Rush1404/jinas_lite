// ─── Admin Form Page ────────────────────────────────────────────────────────
// Single form used for both creating and editing a product. Handles:
//   - Image upload (Supabase storage, or object URL in dev)
//   - All specification fields (gold weights, diamond weight, silver, size)
//   - Price, SKU, name, description
//   - Sub-category, category (collection), gender
//   - Active/hidden toggle
// ────────────────────────────────────────────────────────────────────────────

import {
  getProductBySku,
  createProduct,
  updateProduct,
  uploadProductImage,
  type ProductInput,
} from "../../services/adminService";
import { isAdminUnlocked } from "../../lib/adminGate";
import { routes, navigate } from "../../utils/router";
import type { Product, SubCategory, Category, Gender } from "../../types/product";

const SUB_CATEGORIES: SubCategory[] = ["RING", "EARRING", "LOOSE_BRACELET", "PENDANT"];
const CATEGORIES: Category[] = [
  "ETERNITY_COLLECTION",
  "FOUR_DIAMOND_COLLECTION",
  "FULL_JACKET_COLLECTION",
  "HALF_JACKET_COLLECTION",
  "SINGLE_DIAMOND_COLLECTION",
  "THREE_DIAMOND_COLLECTION",
  "TWO_DIAMOND_COLLECTION",
];
const GENDERS: Gender[] = ["WOMEN", "MEN", "UNISEX"];

let currentProduct: Product | null = null;

// ─── Render ─────────────────────────────────────────────────────────────────
export function renderAdminFormPage(mode: "new" | "edit", sku?: string): string {
  if (!isAdminUnlocked()) {
    // Bounce back to gated list. The list page will render the gate.
    setTimeout(() => navigate(routes.admin()), 0);
    return `<section class="admin-page"><p class="admin-loading">Redirecting…</p></section>`;
  }

  return `
    <section class="admin-page">
      <header class="admin-header">
        <div>
          <a href="${routes.admin()}" class="admin-back">← All products</a>
          <h1 class="admin-title">${mode === "new" ? "New product" : `Edit ${sku ?? ""}`}</h1>
        </div>
      </header>
      <div id="admin-form-mount">
        <p class="admin-loading">Loading…</p>
      </div>
    </section>
  `;
}

export async function initAdminFormPage(mode: "new" | "edit", sku?: string) {
  if (!isAdminUnlocked()) return;

  const mount = document.getElementById("admin-form-mount");
  if (!mount) return;

  if (mode === "edit" && sku) {
    currentProduct = await getProductBySku(sku);
    if (!currentProduct) {
      mount.innerHTML = `<p class="auth-error">Product not found.</p>`;
      return;
    }
  } else {
    currentProduct = null;
  }

  mount.innerHTML = renderForm(currentProduct);
  wireForm(mode);
}

// ─── Form HTML ──────────────────────────────────────────────────────────────
function renderForm(product: Product | null): string {
  const v = (key: keyof Product, fallback: any = "") =>
    product ? (product as any)[key] ?? fallback : fallback;

  return `
    <form class="admin-form" id="product-form" novalidate>

      <div class="admin-form-grid">
        <!-- ── Image column ─────────────────────────────────────────── -->
        <div class="admin-form-col">
          <label class="admin-label">Primary image</label>
          <div class="admin-image-preview" id="image-preview">
            ${
              product?.image
                ? `<img src="${product.image}" alt="" />`
                : `<span class="admin-image-placeholder">No image yet</span>`
            }
          </div>
          <input type="file" id="image-file" accept="image/*" class="admin-file-input" />
          <label for="image-file" class="btn-ghost admin-upload-btn">
            <span>Upload image</span>
          </label>
          <p class="admin-hint">Or paste a URL below if hosted elsewhere.</p>
          <input
            type="url"
            name="image"
            id="image-url"
            placeholder="https://…"
            value="${v("image")}"
            class="admin-input"
          />
        </div>

        <!-- ── Fields column ────────────────────────────────────────── -->
        <div class="admin-form-col admin-form-col-wide">

          <div class="admin-row-2">
            <label class="admin-field">
              <span class="admin-label">SKU *</span>
              <input type="text" name="sku" required value="${v("sku")}" class="admin-input"
                ${product ? "readonly" : ""} placeholder="e.g. RG0203" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Price (USD) *</span>
              <input type="number" name="price" required min="0" step="0.01"
                value="${v("price", 0)}" class="admin-input" />
            </label>
          </div>

          <label class="admin-field">
            <span class="admin-label">Name *</span>
            <input type="text" name="name" required value="${v("name")}" class="admin-input"
              placeholder="e.g. Solitaire Diamond Ring" />
          </label>

          <label class="admin-field">
            <span class="admin-label">Description</span>
            <textarea name="description" rows="4" class="admin-input">${v("description")}</textarea>
          </label>

          <div class="admin-row-3">
            <label class="admin-field">
              <span class="admin-label">Sub-category *</span>
              <select name="subCategory" required class="admin-input">
                ${SUB_CATEGORIES.map(
                  (s) => `<option value="${s}" ${v("subCategory") === s ? "selected" : ""}>${s}</option>`
                ).join("")}
              </select>
            </label>
            <label class="admin-field">
              <span class="admin-label">Collection *</span>
              <select name="category" required class="admin-input">
                ${CATEGORIES.map(
                  (c) => `<option value="${c}" ${v("category") === c ? "selected" : ""}>${c.replace(/_/g, " ")}</option>`
                ).join("")}
              </select>
            </label>
            <label class="admin-field">
              <span class="admin-label">For *</span>
              <select name="gender" required class="admin-input">
                ${GENDERS.map(
                  (g) => `<option value="${g}" ${(v("gender") || "WOMEN") === g ? "selected" : ""}>${g}</option>`
                ).join("")}
              </select>
            </label>
          </div>

          <h3 class="admin-section-heading">Specifications</h3>

          <div class="admin-row-3">
            <label class="admin-field">
              <span class="admin-label">Diamond Wt (ct)</span>
              <input type="number" name="diamondWt" step="0.01" min="0"
                value="${v("diamondWt", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Default carat</span>
              <input type="number" name="selectedCarat" step="0.01" min="0"
                value="${v("selectedCarat", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Size</span>
              <input type="number" name="size" step="0.01" min="0"
                value="${v("size", 0)}" class="admin-input" />
            </label>
          </div>

          <div class="admin-row-3">
            <label class="admin-field">
              <span class="admin-label">Gold Wt 18k (gm)</span>
              <input type="number" name="goldWt18k" step="0.001" min="0"
                value="${v("goldWt18k", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Gold Wt 14k (gm)</span>
              <input type="number" name="goldWt14k" step="0.001" min="0"
                value="${v("goldWt14k", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Silver 925 (gm)</span>
              <input type="number" name="silver925" step="0.001" min="0"
                value="${v("silver925", 0)}" class="admin-input" />
            </label>
          </div>

          <label class="admin-field admin-checkbox-field">
            <input type="checkbox" name="isActive"
              ${product?.isActive === false ? "" : "checked"} />
            <span class="admin-label">Visible on storefront</span>
          </label>

          <p class="auth-error" id="form-error" hidden></p>

          <div class="admin-form-actions">
            <a href="${routes.admin()}" class="btn-ghost"><span>Cancel</span></a>
            <button type="submit" class="btn-primary"><span data-form-submit>Save product</span></button>
          </div>
        </div>
      </div>
    </form>
  `;
}

// ─── Form wiring ────────────────────────────────────────────────────────────
function wireForm(mode: "new" | "edit") {
  const form = document.getElementById("product-form") as HTMLFormElement | null;
  const fileInput = document.getElementById("image-file") as HTMLInputElement | null;
  const urlInput = document.getElementById("image-url") as HTMLInputElement | null;
  const preview = document.getElementById("image-preview") as HTMLDivElement | null;
  const errorEl = document.getElementById("form-error");
  const submitLabel = document.querySelector("[data-form-submit]") as HTMLElement | null;
  if (!form || !errorEl || !submitLabel) return;

  // ── Image upload
  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (!file || !preview || !urlInput) return;

    // Use the SKU input as the upload key; fall back to "TEMP" if empty.
    const skuField = form.querySelector<HTMLInputElement>('input[name="sku"]');
    const skuVal = skuField?.value.trim() || "TEMP";

    submitLabel.textContent = "Uploading…";
    try {
      const url = await uploadProductImage(file, skuVal);
      urlInput.value = url;
      preview.innerHTML = `<img src="${url}" alt="" />`;
    } catch (err: any) {
      errorEl.textContent = "Upload failed: " + err.message;
      errorEl.hidden = false;
    } finally {
      submitLabel.textContent = "Save product";
    }
  });

  // Live preview when pasting a URL
  urlInput?.addEventListener("input", () => {
    if (!preview) return;
    const url = urlInput.value.trim();
    preview.innerHTML = url
      ? `<img src="${url}" alt="" onerror="this.outerHTML='<span class=admin-image-placeholder>Image failed to load</span>'" />`
      : `<span class="admin-image-placeholder">No image yet</span>`;
  });

  // ── Submit
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const data = new FormData(form);
    const input: ProductInput = {
      sku: String(data.get("sku") || "").trim().toUpperCase(),
      name: String(data.get("name") || "").trim(),
      description: String(data.get("description") || "").trim(),
      image: String(data.get("image") || "").trim(),
      price: parseFloat(String(data.get("price") || 0)),
      goldWt18k: parseFloat(String(data.get("goldWt18k") || 0)),
      goldWt14k: parseFloat(String(data.get("goldWt14k") || 0)),
      diamondWt: parseFloat(String(data.get("diamondWt") || 0)),
      silver925: parseFloat(String(data.get("silver925") || 0)),
      size: parseFloat(String(data.get("size") || 0)),
      selectedCarat: parseFloat(String(data.get("selectedCarat") || 0)),
      category: String(data.get("category") || "SINGLE_DIAMOND_COLLECTION") as Category,
      subCategory: String(data.get("subCategory") || "RING") as SubCategory,
      gender: String(data.get("gender") || "WOMEN") as Gender,
      isActive: data.get("isActive") === "on",
    };

    if (!input.sku || !input.name || !input.image) {
      errorEl.textContent = "SKU, name, and image are required.";
      errorEl.hidden = false;
      return;
    }

    submitLabel.textContent = "Saving…";
    try {
      if (mode === "edit" && currentProduct) {
        await updateProduct(currentProduct.id, input);
      } else {
        await createProduct(input);
      }
      navigate(routes.admin());
    } catch (err: any) {
      errorEl.textContent = err?.message ?? "Save failed";
      errorEl.hidden = false;
      submitLabel.textContent = "Save product";
    }
  });
}