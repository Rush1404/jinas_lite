// ─── Admin Form Page ────────────────────────────────────────────────────────
// Single form used for both creating and editing a product. Handles:
//   - MULTI-IMAGE gallery editor with PER-IMAGE COLOR TAGS
//     (upload, paste URL, reorder, remove, tag color)
//   - All specification fields (gold weights, diamond weight, silver, size)
//   - Price, SKU, name, description
//   - Sub-category, category (collection), gender
//   - Active/hidden toggle
//
// Color tags: each gallery image can be tagged with a color (e.g. "silver",
// "gold"), or left as "Any color" (null) to be shown for every selection.
// On the storefront, picking a color swatch on the PDP filters the
// thumbnail strip to images matching that tag (plus untagged images).
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
import type {
  Product,
  GalleryImage,
  SubCategory,
  Category,
  Gender,
} from "../../types/product";

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

// The set of color options Jina can pick from. Add more here as needed —
// the only thing that has to be lowercase is the *value*; the label is free.
// "" represents "Any color" (untagged) and is stored as NULL.
const COLOR_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Any color" },
  { value: "silver", label: "Silver" },
  { value: "gold", label: "Gold" },
  { value: "rose gold", label: "Rose Gold" },
  { value: "white gold", label: "White Gold" },
];

let currentProduct: Product | null = null;

/**
 * Local gallery state. The first entry is always the primary image.
 * Each entry carries a color tag (or null for "any color").
 */
let galleryImages: GalleryImage[] = [];

// ─── Render ─────────────────────────────────────────────────────────────────
export function renderAdminFormPage(mode: "new" | "edit", sku?: string): string {
  if (!isAdminUnlocked()) {
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

  // Seed the gallery from the existing product (or empty for new).
  if (currentProduct?.gallery?.length) {
    galleryImages = currentProduct.gallery.map((g) => ({ ...g }));
  } else if (currentProduct?.image) {
    galleryImages = [{ url: currentProduct.image, color: null }];
  } else {
    galleryImages = [];
  }

  mount.innerHTML = renderForm(currentProduct);
  rerenderGalleryStrip();
  wireForm(mode);
}

// ─── Form HTML ──────────────────────────────────────────────────────────────
function renderForm(product: Product | null): string {
  const v = (key: keyof Product, fallback: any = "") =>
    product ? (product as any)[key] ?? fallback : fallback;

  return `
    <form class="admin-form" id="product-form" novalidate>

      <!-- ── Image gallery (full width) ──────────────────────────────── -->
      <div class="admin-gallery-section">
        <div class="admin-gallery-header">
          <label class="admin-label">Images</label>
          <p class="admin-hint">
            First image is the primary — it shows on cards. Tag each image with
            a color so the storefront can filter by silver / gold / etc. Leave
            as "Any color" for lifestyle or scale shots that should show
            regardless of color.
          </p>
        </div>
        <div class="admin-gallery-strip" id="gallery-strip"></div>
        <p class="admin-gallery-error auth-error" id="gallery-error" hidden></p>
      </div>

      <div class="admin-form-grid admin-form-grid-single">
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
            <input type="text" name="name" required value="${v("name")}" class="admin-input" />
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
                  (s) => `<option value="${s}" ${v("subCategory") === s ? "selected" : ""}>${s.replace(/_/g, " ")}</option>`
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
                  (g) => `<option value="${g}" ${v("gender") === g ? "selected" : ""}>${g}</option>`
                ).join("")}
              </select>
            </label>
          </div>

          <h3 class="admin-section-heading">Specifications</h3>

          <div class="admin-row-3">
            <label class="admin-field">
              <span class="admin-label">Selected carat</span>
              <input type="number" name="selectedCarat" min="0" step="0.01"
                value="${v("selectedCarat", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Diamond wt (ct)</span>
              <input type="number" name="diamondWt" min="0" step="0.01"
                value="${v("diamondWt", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Size</span>
              <input type="number" name="size" min="0" step="0.01"
                value="${v("size", 0)}" class="admin-input" />
            </label>
          </div>

          <div class="admin-row-3">
            <label class="admin-field">
              <span class="admin-label">Gold 18k (gm)</span>
              <input type="number" name="goldWt18k" min="0" step="0.01"
                value="${v("goldWt18k", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Gold 14k (gm)</span>
              <input type="number" name="goldWt14k" min="0" step="0.01"
                value="${v("goldWt14k", 0)}" class="admin-input" />
            </label>
            <label class="admin-field">
              <span class="admin-label">Silver 925 (gm)</span>
              <input type="number" name="silver925" min="0" step="0.01"
                value="${v("silver925", 0)}" class="admin-input" />
            </label>
          </div>

          <label class="admin-field admin-checkbox-field">
            <input type="checkbox" name="isActive"
              ${product ? (product.isActive === false ? "" : "checked") : "checked"} />
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

    <!-- Hidden file input for multi-image upload -->
    <input type="file" id="gallery-file-input" accept="image/*" multiple class="admin-file-input" />
  `;
}

// ─── Gallery strip rendering & wiring ───────────────────────────────────────

function renderColorSelect(currentColor: string | null, index: number): string {
  const current = currentColor ?? "";
  return `
    <select class="admin-gallery-color-select" data-color-index="${index}" aria-label="Image color tag">
      ${COLOR_OPTIONS.map(
        (opt) => `
          <option value="${opt.value}" ${opt.value === current ? "selected" : ""}>
            ${opt.label}
          </option>
        `
      ).join("")}
    </select>
  `;
}

function rerenderGalleryStrip() {
  const strip = document.getElementById("gallery-strip");
  if (!strip) return;

  const tiles = galleryImages
    .map(
      (img, i) => `
        <div class="admin-gallery-tile ${i === 0 ? "is-primary" : ""}" data-index="${i}">
          <div class="admin-gallery-thumb">
            <img src="${img.url}" alt="" onerror="this.outerHTML='<span class=admin-gallery-broken>Broken</span>'" />
            ${i === 0 ? `<span class="admin-gallery-badge">Primary</span>` : ""}
          </div>
          <div class="admin-gallery-tile-actions">
            ${renderColorSelect(img.color, i)}
            ${
              i === 0
                ? ""
                : `<button type="button" class="admin-gallery-action" data-make-primary="${i}">Make primary</button>`
            }
            <button type="button" class="admin-gallery-action admin-gallery-action-danger" data-remove="${i}">Remove</button>
          </div>
        </div>
      `
    )
    .join("");

  strip.innerHTML = `
    ${tiles}
    <div class="admin-gallery-add">
      <button type="button" class="admin-gallery-add-btn" id="gallery-upload-trigger">
        <span class="admin-gallery-add-icon">+</span>
        <span>Upload image${galleryImages.length === 0 ? "s" : ""}</span>
      </button>
      <div class="admin-gallery-url-row">
        <input
          type="url"
          id="gallery-url-input"
          placeholder="…or paste image URL"
          class="admin-input admin-gallery-url-input"
        />
        <button type="button" class="admin-gallery-url-add" id="gallery-url-add-btn">Add</button>
      </div>
    </div>
  `;

  // Wire tile actions
  strip.querySelectorAll<HTMLButtonElement>("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.remove);
      if (Number.isNaN(idx)) return;
      galleryImages.splice(idx, 1);
      rerenderGalleryStrip();
    });
  });

  strip.querySelectorAll<HTMLButtonElement>("[data-make-primary]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const idx = Number(btn.dataset.makePrimary);
      if (Number.isNaN(idx) || idx === 0) return;
      const [picked] = galleryImages.splice(idx, 1);
      galleryImages.unshift(picked);
      rerenderGalleryStrip();
    });
  });

  // Color selects — update gallery state live (no re-render needed)
  strip.querySelectorAll<HTMLSelectElement>(".admin-gallery-color-select").forEach((sel) => {
    sel.addEventListener("change", () => {
      const idx = Number(sel.dataset.colorIndex);
      if (Number.isNaN(idx) || !galleryImages[idx]) return;
      const v = sel.value.trim();
      galleryImages[idx].color = v ? v : null;
    });
  });

  // Upload trigger
  document.getElementById("gallery-upload-trigger")?.addEventListener("click", () => {
    document.getElementById("gallery-file-input")?.click();
  });

  // Paste-URL "Add" button
  const urlInput = document.getElementById("gallery-url-input") as HTMLInputElement | null;
  const urlAddBtn = document.getElementById("gallery-url-add-btn");
  const addUrl = () => {
    if (!urlInput) return;
    const url = urlInput.value.trim();
    if (!url) return;
    if (galleryImages.some((g) => g.url === url)) {
      urlInput.value = "";
      return;
    }
    galleryImages.push({ url, color: null });
    urlInput.value = "";
    rerenderGalleryStrip();
  };
  urlAddBtn?.addEventListener("click", addUrl);
  urlInput?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addUrl();
    }
  });
}

// ─── Form wiring ────────────────────────────────────────────────────────────
function wireForm(mode: "new" | "edit") {
  const form = document.getElementById("product-form") as HTMLFormElement | null;
  const fileInput = document.getElementById("gallery-file-input") as HTMLInputElement | null;
  const errorEl = document.getElementById("form-error");
  const galleryErrEl = document.getElementById("gallery-error");
  const submitLabel = document.querySelector("[data-form-submit]") as HTMLElement | null;
  if (!form || !errorEl || !submitLabel) return;

  // ── Multi-image upload
  fileInput?.addEventListener("change", async () => {
    const files = fileInput.files ? Array.from(fileInput.files) : [];
    if (files.length === 0) return;

    const skuField = form.querySelector<HTMLInputElement>('input[name="sku"]');
    const skuVal = skuField?.value.trim() || "TEMP";

    if (galleryErrEl) galleryErrEl.hidden = true;
    submitLabel.textContent = `Uploading 0/${files.length}…`;

    let done = 0;
    for (const file of files) {
      try {
        const url = await uploadProductImage(file, skuVal, galleryImages.length);
        galleryImages.push({ url, color: null });
        done++;
        submitLabel.textContent = `Uploading ${done}/${files.length}…`;
        rerenderGalleryStrip();
      } catch (err: any) {
        if (galleryErrEl) {
          galleryErrEl.textContent = `Upload failed: ${err?.message ?? err}`;
          galleryErrEl.hidden = false;
        }
        break;
      }
    }

    submitLabel.textContent = "Save product";
    fileInput.value = "";
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
      image: galleryImages[0]?.url ?? "",
      gallery: galleryImages.map((g) => ({ ...g })),
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

    if (!input.sku || !input.name) {
      errorEl.textContent = "SKU and name are required.";
      errorEl.hidden = false;
      return;
    }
    if (galleryImages.length === 0) {
      errorEl.textContent = "Add at least one image.";
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