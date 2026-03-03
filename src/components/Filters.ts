import {
  FilterState,
  SubCategory,
  Category,
  defaultFilterState,
} from "../types/product.ts";
import { formatSubCategory, formatCategory } from "../utils/filters.ts";

const SUB_CATEGORIES: SubCategory[] = [
  "ALL",
  "LOOSE_BRACELET",
  "EARRING",
  "RING",
  "PENDANT",
];

const DIAMOND_CARATS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5];
const DIAMOND_CARATS_MORE = [2.0, 2.5, 3.0, 4.0, 5.0, 7.0, 10.0, 12.0];

const SIZES = [0.5, 1.0, 2.0, 0.25];

const CATEGORIES: Category[] = [
  "ETERNITY_COLLECTION",
  "FOUR_DIAMOND_COLLECTION",
  "FULL_JACKET_COLLECTION",
  "HALF_JACKET_COLLECTION",
  "SINGLE_DIAMOND_COLLECTION",
  "THREE_DIAMOND_COLLECTION",
  "TWO_DIAMOND_COLLECTION",
];

let currentFilters: FilterState = { ...defaultFilterState };
let showMoreCarats = false;

type FilterChangeCallback = (filters: FilterState) => void;
let onFilterChange: FilterChangeCallback | null = null;

export function setFilterChangeCallback(cb: FilterChangeCallback) {
  onFilterChange = cb;
}

export function getFilters(): FilterState {
  return { ...currentFilters };
}

function emitChange() {
  if (onFilterChange) {
    onFilterChange({ ...currentFilters });
  }
}

function renderCheckboxGroup(
  items: { value: string; label: string; checked: boolean }[],
  groupName: string
): string {
  return items
    .map(
      (item) => `
    <label class="filter-option">
      <input type="checkbox" data-group="${groupName}" data-value="${item.value}" ${item.checked ? "checked" : ""} />
      <span>${item.label}</span>
    </label>
  `
    )
    .join("");
}

function renderRangeInput(
  prefix: string,
  minVal: number | null,
  maxVal: number | null,
  currency: boolean = false
): string {
  const currencyPrefix = currency ? '<span style="margin-right: 4px; color: var(--color-text-muted);">$</span>' : "";
  return `
    <div class="filter-range">
      <div class="filter-range-input" style="display: flex; align-items: center;">
        ${currencyPrefix}
        <input type="number" placeholder="Min" data-range="${prefix}-min" value="${minVal ?? ""}" style="border: none; outline: none; width: 100%; font-family: var(--font-body); font-size: 0.8rem; font-weight: 300; background: transparent;" />
      </div>
      <span class="filter-range-separator">–</span>
      <div class="filter-range-input" style="display: flex; align-items: center;">
        ${currencyPrefix}
        <input type="number" placeholder="Max" data-range="${prefix}-max" value="${maxVal ?? ""}" style="border: none; outline: none; width: 100%; font-family: var(--font-body); font-size: 0.8rem; font-weight: 300; background: transparent;" />
      </div>
    </div>
  `;
}

export function renderFilters(): string {
  const carats = showMoreCarats
    ? [...DIAMOND_CARATS, ...DIAMOND_CARATS_MORE]
    : DIAMOND_CARATS;

  return `
    <aside class="filters-sidebar" id="filters-sidebar">

      <!-- Sub Categories -->
      <div class="filter-section">
        <h3 class="filter-section-title">Sub Categories</h3>
        ${renderCheckboxGroup(
          SUB_CATEGORIES.map((sc) => ({
            value: sc,
            label: formatSubCategory(sc),
            checked: currentFilters.subCategory === sc,
          })),
          "subCategory"
        )}
      </div>

      <!-- Diamond Carat -->
      <div class="filter-section">
        <h3 class="filter-section-title">Diamond Carat</h3>
        ${renderCheckboxGroup(
          carats.map((c) => ({
            value: c.toString(),
            label: `${c.toFixed(2)} Ct`,
            checked: currentFilters.diamondCarat.includes(c),
          })),
          "diamondCarat"
        )}
        <button class="filter-view-more" id="toggle-more-carats">
          ${showMoreCarats ? "View Less" : "View More"}
        </button>
      </div>

      <!-- Sizes -->
      <div class="filter-section">
        <h3 class="filter-section-title">Sizes</h3>
        ${renderCheckboxGroup(
          SIZES.map((s) => ({
            value: s.toString(),
            label: `${s.toFixed(2)} Ct`,
            checked: currentFilters.sizes.includes(s),
          })),
          "sizes"
        )}
      </div>

      <!-- Price -->
      <div class="filter-section">
        <h3 class="filter-section-title">Price</h3>
        ${renderRangeInput("price", currentFilters.priceMin, currentFilters.priceMax, true)}
      </div>

      <!-- Category -->
      <div class="filter-section">
        <h3 class="filter-section-title">Category</h3>
        ${renderCheckboxGroup(
          CATEGORIES.map((cat) => ({
            value: cat,
            label: formatCategory(cat),
            checked: currentFilters.category.includes(cat),
          })),
          "category"
        )}
      </div>

      <!-- Silver 925 -->
      <div class="filter-section">
        <h3 class="filter-section-title">Silver 925</h3>
        ${renderRangeInput("silver925", currentFilters.silver925Min, currentFilters.silver925Max)}
      </div>

      <!-- Diamond Wt (ct) -->
      <div class="filter-section">
        <h3 class="filter-section-title">Diamond Wt (ct)</h3>
        ${renderRangeInput("diamondWt", currentFilters.diamondWtMin, currentFilters.diamondWtMax)}
      </div>

      <!-- Gold Wt 14k -->
      <div class="filter-section">
        <h3 class="filter-section-title">Gold Wt 14k (gm)</h3>
        ${renderRangeInput("goldWt14k", currentFilters.goldWt14kMin, currentFilters.goldWt14kMax)}
      </div>

      <!-- Gold Wt 18k -->
      <div class="filter-section">
        <h3 class="filter-section-title">Gold Wt 18k (gm)</h3>
        ${renderRangeInput("goldWt18k", currentFilters.goldWt18kMin, currentFilters.goldWt18kMax)}
      </div>

    </aside>
  `;
}

export function initFilterEvents() {
  const sidebar = document.getElementById("filters-sidebar");
  if (!sidebar) return;

  // Checkbox changes
  sidebar.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.type !== "checkbox") {
      // Range inputs
      const rangeKey = target.dataset.range;
      if (rangeKey) {
        const val = target.value ? parseFloat(target.value) : null;
        (currentFilters as any)[
          rangeKey.replace("-", "").replace("min", "Min").replace("max", "Max")
            .replace("priceMin", "priceMin")
            .replace("priceMax", "priceMax")
        ] = val;
        emitChange();
      }
      return;
    }

    const group = target.dataset.group;
    const value = target.dataset.value;
    if (!group || !value) return;

    if (group === "subCategory") {
      // Radio-like behavior — only one selected at a time
      currentFilters.subCategory = target.checked
        ? (value as SubCategory)
        : null;
      // Uncheck others
      sidebar
        .querySelectorAll<HTMLInputElement>(
          `input[data-group="subCategory"]`
        )
        .forEach((cb) => {
          if (cb.dataset.value !== value) cb.checked = false;
        });
    } else if (group === "diamondCarat") {
      const num = parseFloat(value);
      if (target.checked) {
        currentFilters.diamondCarat.push(num);
      } else {
        currentFilters.diamondCarat = currentFilters.diamondCarat.filter(
          (c) => c !== num
        );
      }
    } else if (group === "sizes") {
      const num = parseFloat(value);
      if (target.checked) {
        currentFilters.sizes.push(num);
      } else {
        currentFilters.sizes = currentFilters.sizes.filter((s) => s !== num);
      }
    } else if (group === "category") {
      const cat = value as Category;
      if (target.checked) {
        currentFilters.category.push(cat);
      } else {
        currentFilters.category = currentFilters.category.filter(
          (c) => c !== cat
        );
      }
    }

    emitChange();
  });

  // Range input changes
  sidebar.addEventListener("input", (e) => {
    const target = e.target as HTMLInputElement;
    const rangeKey = target.dataset.range;
    if (!rangeKey) return;

    const val = target.value ? parseFloat(target.value) : null;

    // Map data-range attribute to filter key
    const keyMap: Record<string, keyof FilterState> = {
      "price-min": "priceMin",
      "price-max": "priceMax",
      "silver925-min": "silver925Min",
      "silver925-max": "silver925Max",
      "diamondWt-min": "diamondWtMin",
      "diamondWt-max": "diamondWtMax",
      "goldWt14k-min": "goldWt14kMin",
      "goldWt14k-max": "goldWt14kMax",
      "goldWt18k-min": "goldWt18kMin",
      "goldWt18k-max": "goldWt18kMax",
    };

    const filterKey = keyMap[rangeKey];
    if (filterKey) {
      (currentFilters as any)[filterKey] = val;
      emitChange();
    }
  });

  // View more carats button
  const viewMoreBtn = document.getElementById("toggle-more-carats");
  if (viewMoreBtn) {
    viewMoreBtn.addEventListener("click", () => {
      showMoreCarats = !showMoreCarats;
      // Re-render sidebar
      const container = document.getElementById("filters-container");
      if (container) {
        container.innerHTML = renderFilters();
        initFilterEvents();
      }
    });
  }
}