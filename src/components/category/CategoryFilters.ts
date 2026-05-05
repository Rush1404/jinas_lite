// ─── Category Filters ───────────────────────────────────────────────────────
// Inline filter bar for category / gender / all-jewelry pages.
//
// Filters provided:
//   - Sort By  (Top Match, Price ↑, Price ↓, Newest)
//   - Material (fixed 6-option list — 10k/14k × yellow/white/rose gold)
//   - Colour   (auto-derived from the products visible on the current page)
//   - Price    (dual-handle range slider, bounds derived from the page's
//              min/max product price)
//
// Each trigger opens a popover anchored beneath the filter bar. Selecting
// values updates a local filter state and emits a change event so the
// owning page can re-render its grid.
//
// State is module-scoped and gets reset every time `mountCategoryFilters`
// is called, so navigating between category pages always starts clean.
//
// Implementation note: we never replace the bar's outerHTML, because that
// would detach our event listeners. Trigger labels, pills, and the
// clear-all button are mutated in place; panel bodies get fresh innerHTML
// on clear-all (safe — listeners are bound to the bar, not to the inputs).
// ────────────────────────────────────────────────────────────────────────────

import { type Product, availableColors } from "../../types/product";
import { formatCurrency } from "../../utils/filters";

// ─── Types ──────────────────────────────────────────────────────────────────

export type SortKey = "match" | "price-asc" | "price-desc" | "newest";

export interface CategoryFilterState {
  sort: SortKey;
  materials: string[];
  colours: string[];
  priceMin: number;
  priceMax: number;
}

export interface FilterBounds {
  priceMin: number;
  priceMax: number;
  availableColours: string[];
}

// ─── Static config ──────────────────────────────────────────────────────────

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "match", label: "Top Match" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest" },
];

const MATERIAL_OPTIONS: { value: string; label: string }[] = [
  { value: "14k-white-gold", label: "14k White Gold" },
  { value: "14k-gold",       label: "14k Gold" },
  { value: "14k-rose-gold",  label: "14k Rose Gold" },
  { value: "10k-white-gold", label: "10k White Gold" },
  { value: "10k-gold",       label: "10k Gold" },
  { value: "10k-rose-gold",  label: "10k Rose Gold" },
];

// ─── Module state ───────────────────────────────────────────────────────────

let bounds: FilterBounds = { priceMin: 0, priceMax: 0, availableColours: [] };
let state: CategoryFilterState = {
  sort: "match",
  materials: [],
  colours: [],
  priceMin: 0,
  priceMax: 0,
};

type ChangeListener = (next: CategoryFilterState) => void;
let listener: ChangeListener | null = null;

let activePanel: string | null = null;
let outsideClickHandler: ((e: MouseEvent) => void) | null = null;
let escHandler: ((e: KeyboardEvent) => void) | null = null;

// ─── Public API ─────────────────────────────────────────────────────────────

export function computeBounds(products: Product[]): FilterBounds {
  if (products.length === 0) {
    return { priceMin: 0, priceMax: 0, availableColours: [] };
  }
  let min = Infinity;
  let max = -Infinity;
  const colourSet = new Set<string>();
  for (const p of products) {
    if (p.price < min) min = p.price;
    if (p.price > max) max = p.price;
    const colours = p.gallery ? availableColors(p.gallery) : [];
    for (const c of colours) colourSet.add(c);
  }
  return {
    priceMin: Math.floor(min),
    priceMax: Math.ceil(max),
    availableColours: Array.from(colourSet).sort(),
  };
}

export function applyFilters(
  products: Product[],
  s: CategoryFilterState
): Product[] {
  let out = products.slice();

  if (s.materials.length > 0) {
    out = out.filter((p) => {
      const mats = (p.materials ?? []).map((m) => m.toLowerCase());
      return s.materials.some((m) => mats.includes(m));
    });
  }

  if (s.colours.length > 0) {
    out = out.filter((p) => {
      const colours = p.gallery ? availableColors(p.gallery) : [];
      return s.colours.some((c) => colours.includes(c));
    });
  }

  if (s.priceMin > bounds.priceMin || s.priceMax < bounds.priceMax) {
    out = out.filter((p) => p.price >= s.priceMin && p.price <= s.priceMax);
  }

  switch (s.sort) {
    case "price-asc":
      out.sort((a, b) => a.price - b.price);
      break;
    case "price-desc":
      out.sort((a, b) => b.price - a.price);
      break;
    case "newest":
      out.sort((a, b) => b.sku.localeCompare(a.sku));
      break;
    case "match":
    default:
      break;
  }

  return out;
}

/**
 * Render the filter bar HTML. Called once per page mount; subsequent
 * state changes mutate children in place rather than replacing this
 * element.
 */
export function renderCategoryFilterBar(productCount: number): string {
  return `
    <div class="cat-filter-bar" data-cat-filters>
      <div class="cat-filter-options" data-cat-options>
        ${renderTriggers()}
      </div>

      <div class="cat-filter-meta">
        <span class="cat-product-count">(${productCount} ${productCount === 1 ? "Piece" : "Pieces"})</span>
      </div>

      <div class="cat-popover" data-cat-panel="sort" hidden>
        <div data-cat-panel-body="sort">${renderSortPanel()}</div>
      </div>
      <div class="cat-popover" data-cat-panel="material" hidden>
        <div data-cat-panel-body="material">${renderMaterialPanel()}</div>
      </div>
      <div class="cat-popover" data-cat-panel="colour" hidden>
        <div data-cat-panel-body="colour">${renderColourPanel()}</div>
      </div>
      <div class="cat-popover cat-popover-wide" data-cat-panel="price" hidden>
        <div data-cat-panel-body="price">${renderPricePanel()}</div>
      </div>
    </div>
  `;
}

/**
 * Wire up event handlers + initialise filter state. Returns a teardown
 * function that detaches listeners.
 */
export function mountCategoryFilters(
  allProducts: Product[],
  onChange: (filtered: Product[]) => void
): () => void {
  // Reset state every mount — no stale filters across pages
  bounds = computeBounds(allProducts);
  state = {
    sort: "match",
    materials: [],
    colours: [],
    priceMin: bounds.priceMin,
    priceMax: bounds.priceMax,
  };

  listener = () => onChange(applyFilters(allProducts, state));

  const bar = document.querySelector<HTMLElement>("[data-cat-filters]");
  if (!bar) return () => {};

  // Re-render trigger row + price panel so they reflect the bounds we
  // just computed (the initial server-render emitted defaults).
  const optionsWrap = bar.querySelector<HTMLElement>("[data-cat-options]");
  if (optionsWrap) optionsWrap.innerHTML = renderTriggers();
  const pricePanelBody = bar.querySelector<HTMLElement>('[data-cat-panel-body="price"]');
  if (pricePanelBody) pricePanelBody.innerHTML = renderPricePanel();
  const colourPanelBody = bar.querySelector<HTMLElement>('[data-cat-panel-body="colour"]');
  if (colourPanelBody) colourPanelBody.innerHTML = renderColourPanel();

  bar.addEventListener("click", onBarClick);
  bar.addEventListener("change", onBarChange);
  bar.addEventListener("input", onBarInput);

  outsideClickHandler = (e: MouseEvent) => {
    if (!activePanel) return;
    const target = e.target as HTMLElement;
    if (target.closest("[data-cat-filters]")) return;
    closePanel();
  };
  document.addEventListener("click", outsideClickHandler);

  escHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape" && activePanel) closePanel();
  };
  document.addEventListener("keydown", escHandler);

  return () => {
    bar.removeEventListener("click", onBarClick);
    bar.removeEventListener("change", onBarChange);
    bar.removeEventListener("input", onBarInput);
    if (outsideClickHandler) document.removeEventListener("click", outsideClickHandler);
    if (escHandler) document.removeEventListener("keydown", escHandler);
    outsideClickHandler = null;
    escHandler = null;
    activePanel = null;
    listener = null;
  };
}

// ─── Trigger row + panels ───────────────────────────────────────────────────

function renderTriggers(): string {
  const sortLabel =
    SORT_OPTIONS.find((o) => o.value === state.sort)?.label ?? "Sort";

  const matCount = state.materials.length;
  const colCount = state.colours.length;
  const priceActive =
    state.priceMin > bounds.priceMin || state.priceMax < bounds.priceMax;

  return `
    <button
      class="cat-filter-trigger"
      type="button"
      data-cat-trigger="sort"
      aria-haspopup="true"
      aria-expanded="false"
    >
      <span class="cat-trigger-label">Sort By</span>
      <span class="cat-trigger-value" data-sort-value>${sortLabel}</span>
      <span class="cat-trigger-chev" aria-hidden="true">⌄</span>
    </button>

    <button
      class="cat-filter-trigger ${matCount > 0 ? "is-active" : ""}"
      type="button"
      data-cat-trigger="material"
      aria-haspopup="true"
      aria-expanded="false"
    >
      <span class="cat-trigger-label">Material</span>
      ${matCount > 0 ? `<span class="cat-trigger-pill">${matCount}</span>` : ""}
      <span class="cat-trigger-chev" aria-hidden="true">⌄</span>
    </button>

    <button
      class="cat-filter-trigger ${colCount > 0 ? "is-active" : ""}"
      type="button"
      data-cat-trigger="colour"
      aria-haspopup="true"
      aria-expanded="false"
      ${bounds.availableColours.length === 0 ? "disabled" : ""}
    >
      <span class="cat-trigger-label">Colour</span>
      ${colCount > 0 ? `<span class="cat-trigger-pill">${colCount}</span>` : ""}
      <span class="cat-trigger-chev" aria-hidden="true">⌄</span>
    </button>

    <button
      class="cat-filter-trigger ${priceActive ? "is-active" : ""}"
      type="button"
      data-cat-trigger="price"
      aria-haspopup="true"
      aria-expanded="false"
      ${bounds.priceMin === bounds.priceMax ? "disabled" : ""}
    >
      <span class="cat-trigger-label">Price</span>
      ${priceActive ? `<span class="cat-trigger-pill">•</span>` : ""}
      <span class="cat-trigger-chev" aria-hidden="true">⌄</span>
    </button>

    ${
      hasActiveFilters()
        ? `<button class="cat-clear-all" type="button" data-cat-clear>Clear all</button>`
        : ""
    }
  `;
}

function renderSortPanel(): string {
  return `
    <ul class="cat-popover-list" role="radiogroup" aria-label="Sort by">
      ${SORT_OPTIONS.map(
        (o) => `
          <li>
            <label class="cat-popover-option ${state.sort === o.value ? "is-checked" : ""}">
              <input
                type="radio"
                name="cat-sort"
                value="${o.value}"
                data-cat-input="sort"
                ${state.sort === o.value ? "checked" : ""}
              />
              <span>${o.label}</span>
            </label>
          </li>
        `
      ).join("")}
    </ul>
  `;
}

function renderMaterialPanel(): string {
  return `
    <ul class="cat-popover-list" aria-label="Filter by material">
      ${MATERIAL_OPTIONS.map(
        (o) => `
          <li>
            <label class="cat-popover-option ${state.materials.includes(o.value) ? "is-checked" : ""}">
              <input
                type="checkbox"
                value="${o.value}"
                data-cat-input="material"
                ${state.materials.includes(o.value) ? "checked" : ""}
              />
              <span>${o.label}</span>
            </label>
          </li>
        `
      ).join("")}
    </ul>
  `;
}

function renderColourPanel(): string {
  if (bounds.availableColours.length === 0) {
    return `<p class="cat-popover-empty">No colours available.</p>`;
  }
  return `
    <ul class="cat-popover-list" aria-label="Filter by colour">
      ${bounds.availableColours
        .map(
          (c) => `
            <li>
              <label class="cat-popover-option ${state.colours.includes(c) ? "is-checked" : ""}">
                <input
                  type="checkbox"
                  value="${c}"
                  data-cat-input="colour"
                  ${state.colours.includes(c) ? "checked" : ""}
                />
                <span class="cat-popover-swatch ${swatchClassFor(c)}" aria-hidden="true"></span>
                <span>${prettyLabel(c)}</span>
              </label>
            </li>
          `
        )
        .join("")}
    </ul>
  `;
}

function renderPricePanel(): string {
  return `
    <div class="cat-price-slider">
      <div class="cat-price-readout">
        <span data-price-readout="min">${formatCurrency(state.priceMin)}</span>
        <span class="cat-price-sep">—</span>
        <span data-price-readout="max">${formatCurrency(state.priceMax)}</span>
      </div>
      <div class="cat-price-track-wrap">
        <div class="cat-price-track">
          <div
            class="cat-price-track-fill"
            data-price-fill
            style="left: ${rangePct(state.priceMin)}%; right: ${100 - rangePct(state.priceMax)}%;"
          ></div>
        </div>
        <input
          type="range"
          class="cat-price-input cat-price-input-min"
          min="${bounds.priceMin}"
          max="${bounds.priceMax}"
          step="1"
          value="${state.priceMin}"
          data-cat-input="price-min"
          aria-label="Minimum price"
        />
        <input
          type="range"
          class="cat-price-input cat-price-input-max"
          min="${bounds.priceMin}"
          max="${bounds.priceMax}"
          step="1"
          value="${state.priceMax}"
          data-cat-input="price-max"
          aria-label="Maximum price"
        />
      </div>
      <div class="cat-price-bounds">
        <span>${formatCurrency(bounds.priceMin)}</span>
        <span>${formatCurrency(bounds.priceMax)}</span>
      </div>
    </div>
  `;
}

// ─── Event handlers ─────────────────────────────────────────────────────────

function onBarClick(e: Event) {
  const target = e.target as HTMLElement;

  if (target.closest("[data-cat-clear]")) {
    e.preventDefault();
    clearAll();
    return;
  }

  const triggerEl = target.closest<HTMLElement>("[data-cat-trigger]");
  if (triggerEl && !triggerEl.hasAttribute("disabled")) {
    e.preventDefault();
    const key = triggerEl.dataset.catTrigger!;
    if (activePanel === key) closePanel();
    else openPanel(key);
  }
}

function onBarChange(e: Event) {
  const target = e.target as HTMLInputElement;
  const kind = target.dataset.catInput;
  if (!kind) return;

  if (kind === "sort") {
    state.sort = target.value as SortKey;
    const valueSpan = document.querySelector<HTMLElement>("[data-sort-value]");
    if (valueSpan) {
      const opt = SORT_OPTIONS.find((o) => o.value === state.sort);
      if (opt) valueSpan.textContent = opt.label;
    }
    document
      .querySelectorAll<HTMLElement>('[data-cat-panel-body="sort"] .cat-popover-option')
      .forEach((opt) => {
        const input = opt.querySelector<HTMLInputElement>('input');
        opt.classList.toggle("is-checked", input?.checked === true);
      });
    refreshClearAll();
    closePanel();
    listener?.(state);
  } else if (kind === "material") {
    const v = target.value;
    if (target.checked) {
      if (!state.materials.includes(v)) state.materials.push(v);
    } else {
      state.materials = state.materials.filter((x) => x !== v);
    }
    const row = target.closest<HTMLElement>(".cat-popover-option");
    row?.classList.toggle("is-checked", target.checked);
    refreshTriggerCounts();
    refreshClearAll();
    listener?.(state);
  } else if (kind === "colour") {
    const v = target.value;
    if (target.checked) {
      if (!state.colours.includes(v)) state.colours.push(v);
    } else {
      state.colours = state.colours.filter((x) => x !== v);
    }
    const row = target.closest<HTMLElement>(".cat-popover-option");
    row?.classList.toggle("is-checked", target.checked);
    refreshTriggerCounts();
    refreshClearAll();
    listener?.(state);
  }
}

function onBarInput(e: Event) {
  const target = e.target as HTMLInputElement;
  const kind = target.dataset.catInput;
  if (kind !== "price-min" && kind !== "price-max") return;

  const val = parseFloat(target.value);
  if (Number.isNaN(val)) return;

  if (kind === "price-min") {
    state.priceMin = Math.min(val, state.priceMax);
    target.value = String(state.priceMin);
  } else {
    state.priceMax = Math.max(val, state.priceMin);
    target.value = String(state.priceMax);
  }

  refreshPriceVisuals();
  refreshTriggerCounts();
  refreshClearAll();
  listener?.(state);
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function clearAll() {
  state = {
    sort: "match",
    materials: [],
    colours: [],
    priceMin: bounds.priceMin,
    priceMax: bounds.priceMax,
  };
  closePanel();

  // Rebuild children in place — bar element + listeners stay intact.
  const optionsWrap = document.querySelector<HTMLElement>("[data-cat-options]");
  if (optionsWrap) optionsWrap.innerHTML = renderTriggers();

  rerenderPanelBody("sort", renderSortPanel());
  rerenderPanelBody("material", renderMaterialPanel());
  rerenderPanelBody("colour", renderColourPanel());
  rerenderPanelBody("price", renderPricePanel());

  listener?.(state);
}

function rerenderPanelBody(key: string, html: string) {
  const body = document.querySelector<HTMLElement>(`[data-cat-panel-body="${key}"]`);
  if (body) body.innerHTML = html;
}

function openPanel(key: string) {
  if (activePanel) closePanel();
  const panel = document.querySelector<HTMLElement>(`[data-cat-panel="${key}"]`);
  const trigger = document.querySelector<HTMLElement>(`[data-cat-trigger="${key}"]`);
  if (!panel || !trigger) return;
  panel.hidden = false;
  void panel.offsetWidth;
  panel.classList.add("is-open");
  trigger.setAttribute("aria-expanded", "true");
  trigger.classList.add("is-open");
  activePanel = key;
}

function closePanel() {
  if (!activePanel) return;
  const key = activePanel;
  const panel = document.querySelector<HTMLElement>(`[data-cat-panel="${key}"]`);
  const trigger = document.querySelector<HTMLElement>(`[data-cat-trigger="${key}"]`);
  if (panel) {
    panel.classList.remove("is-open");
    window.setTimeout(() => {
      if (!panel.classList.contains("is-open")) panel.hidden = true;
    }, 200);
  }
  if (trigger) {
    trigger.setAttribute("aria-expanded", "false");
    trigger.classList.remove("is-open");
  }
  activePanel = null;
}

function refreshTriggerCounts() {
  const matBtn = document.querySelector<HTMLElement>('[data-cat-trigger="material"]');
  const colBtn = document.querySelector<HTMLElement>('[data-cat-trigger="colour"]');
  const priceBtn = document.querySelector<HTMLElement>('[data-cat-trigger="price"]');

  if (matBtn) {
    matBtn.classList.toggle("is-active", state.materials.length > 0);
    updatePill(matBtn, state.materials.length > 0 ? String(state.materials.length) : "");
  }
  if (colBtn) {
    colBtn.classList.toggle("is-active", state.colours.length > 0);
    updatePill(colBtn, state.colours.length > 0 ? String(state.colours.length) : "");
  }
  if (priceBtn) {
    const active =
      state.priceMin > bounds.priceMin || state.priceMax < bounds.priceMax;
    priceBtn.classList.toggle("is-active", active);
    updatePill(priceBtn, active ? "•" : "");
  }
}

function refreshClearAll() {
  const optionsWrap = document.querySelector<HTMLElement>("[data-cat-options]");
  if (!optionsWrap) return;
  const existing = optionsWrap.querySelector<HTMLElement>("[data-cat-clear]");
  if (hasActiveFilters() && !existing) {
    const btn = document.createElement("button");
    btn.className = "cat-clear-all";
    btn.type = "button";
    btn.dataset.catClear = "";
    btn.textContent = "Clear all";
    optionsWrap.appendChild(btn);
  } else if (!hasActiveFilters() && existing) {
    existing.remove();
  }
}

function updatePill(triggerEl: HTMLElement, content: string) {
  const existing = triggerEl.querySelector<HTMLElement>(".cat-trigger-pill");
  if (content && !existing) {
    const span = document.createElement("span");
    span.className = "cat-trigger-pill";
    span.textContent = content;
    const chev = triggerEl.querySelector(".cat-trigger-chev");
    if (chev) triggerEl.insertBefore(span, chev);
    else triggerEl.appendChild(span);
  } else if (content && existing) {
    existing.textContent = content;
  } else if (!content && existing) {
    existing.remove();
  }
}

function refreshPriceVisuals() {
  const fill = document.querySelector<HTMLElement>("[data-price-fill]");
  if (fill) {
    fill.style.left = `${rangePct(state.priceMin)}%`;
    fill.style.right = `${100 - rangePct(state.priceMax)}%`;
  }
  const minOut = document.querySelector<HTMLElement>('[data-price-readout="min"]');
  const maxOut = document.querySelector<HTMLElement>('[data-price-readout="max"]');
  if (minOut) minOut.textContent = formatCurrency(state.priceMin);
  if (maxOut) maxOut.textContent = formatCurrency(state.priceMax);
}

function rangePct(value: number): number {
  if (bounds.priceMax === bounds.priceMin) return 0;
  return ((value - bounds.priceMin) / (bounds.priceMax - bounds.priceMin)) * 100;
}

function hasActiveFilters(): boolean {
  return (
    state.sort !== "match" ||
    state.materials.length > 0 ||
    state.colours.length > 0 ||
    state.priceMin > bounds.priceMin ||
    state.priceMax < bounds.priceMax
  );
}

function prettyLabel(slug: string): string {
  return slug
    .split(/\s+|-/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function swatchClassFor(color: string): string {
  const slug = color.toLowerCase().replace(/\s+/g, "-");
  switch (slug) {
    case "gold":
    case "yellow-gold":
      return "swatch-gold";
    case "gold-deep":
      return "swatch-gold-deep";
    case "silver":
    case "white-gold":
      return "swatch-silver";
    case "rose-gold":
      return "swatch-rose-gold";
    default:
      return "swatch-" + slug;
  }
}