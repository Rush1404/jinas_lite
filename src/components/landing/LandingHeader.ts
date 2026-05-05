// ─── Landing Header ─────────────────────────────────────────────────────────
// Sticky editorial header with dropdown navigation.
//
// Tabs:
//   - Women      → dropdown: Rings / Earrings / Bracelets / Pendants
//   - Men        → dropdown: Rings / Earrings / Bracelets / Pendants
//   - All Jewelry → direct link to landing
//   - Collections → dropdown: the seven Category collections
//
// Behavior:
//   - Desktop: hover opens, leaving the trigger+panel area closes (after a
//     short grace period to allow diagonal mouse travel into the panel)
//   - Mobile (no hover, narrow viewport): tap to toggle, tap outside to close
//   - Esc closes any open panel
// ────────────────────────────────────────────────────────────────────────────

import { routes } from "../../utils/router";
import { cartStore } from "../../lib/cartStore.ts";
import { authStore } from "../../lib/authStore.ts";

// ─── Dropdown contents ──────────────────────────────────────────────────────

interface NavLink {
  label: string;
  href: string;
}

interface NavSection {
  heading: string;
  links: NavLink[];
}

// Subcategories for both Women and Men dropdowns. The destination is the
// same category page; the parent tab is purely an entry point.
const SUBCATEGORY_LINKS: NavLink[] = [
  { label: "Rings", href: routes.category("RING") },
  { label: "Earrings", href: routes.category("EARRING") },
  { label: "Bracelets", href: routes.category("LOOSE_BRACELET") },
  { label: "Pendants", href: routes.category("PENDANT") },
];

const WOMEN_DROPDOWN: NavSection[] = [
  {
    heading: "Shop Women",
    links: [
      { label: "All Women's", href: routes.gender("WOMEN") },
      ...SUBCATEGORY_LINKS,
    ],
  },
];

const MEN_DROPDOWN: NavSection[] = [
  {
    heading: "Shop Men",
    links: [
      { label: "All Men's", href: routes.gender("MEN") },
      ...SUBCATEGORY_LINKS,
    ],
  },
];

// Collections dropdown — for now each collection link points to the
// general subcategory pages. Wire real per-collection routing later.
const COLLECTIONS_DROPDOWN: NavSection[] = [
  {
    heading: "Collections",
    links: [
      { label: "Eternity", href: routes.category("LOOSE_BRACELET") },
      { label: "Single Diamond", href: routes.category("RING") },
      { label: "Two Diamond", href: routes.category("RING") },
      { label: "Three Diamond", href: routes.category("RING") },
      { label: "Four Diamond", href: routes.category("RING") },
      { label: "Half Jacket", href: routes.category("EARRING") },
      { label: "Full Jacket", href: routes.category("EARRING") },
    ],
  },
];

// ─── Render helpers ─────────────────────────────────────────────────────────

function renderDropdownPanel(id: string, sections: NavSection[]): string {
  const sectionsHtml = sections
    .map((section) => {
      const linksHtml = section.links
        .map(
          (link) =>
            '<a href="' + link.href + '" class="nav-dropdown-link">' + link.label + '</a>'
        )
        .join("");
      return (
        '<div class="nav-dropdown-section">' +
          '<p class="nav-dropdown-heading">' + section.heading + '</p>' +
          '<div class="nav-dropdown-links">' + linksHtml + '</div>' +
        '</div>'
      );
    })
    .join("");

  return (
    '<div class="nav-dropdown" id="' + id + '" data-dropdown-panel hidden>' +
      '<div class="nav-dropdown-inner">' + sectionsHtml + '</div>' +
    '</div>'
  );
}

// ─── Top-level render ───────────────────────────────────────────────────────

export function renderLandingHeader(): string {
  const cartCount = cartStore.itemCount();
  const authed = !!authStore.getState().user;

  return `
    <header class="landing-header" data-nav-root>
      <div class="landing-header-inner">
        <nav class="landing-nav" aria-label="Primary">
          <div class="landing-nav-item" data-nav-item="women">
            <button
              class="landing-nav-trigger"
              type="button"
              data-nav-trigger="women"
              aria-haspopup="true"
              aria-expanded="false"
              aria-controls="dropdown-women"
            >
              Women
            </button>
          </div>
          <div class="landing-nav-item" data-nav-item="men">
            <button
              class="landing-nav-trigger"
              type="button"
              data-nav-trigger="men"
              aria-haspopup="true"
              aria-expanded="false"
              aria-controls="dropdown-men"
            >
              Men
            </button>
          </div>
          <div class="landing-nav-item">
            <a href="${routes.all()}" class="landing-nav-link">All Jewelry</a>
          </div>
          <div class="landing-nav-item" data-nav-item="collections">
            <button
              class="landing-nav-trigger"
              type="button"
              data-nav-trigger="collections"
              aria-haspopup="true"
              aria-expanded="false"
              aria-controls="dropdown-collections"
            >
              Collections
            </button>
          </div>
        </nav>

        <a href="${routes.landing()}" class="landing-logo">
          Jina<span class="dot"></span>s<em>&nbsp;Lite</em>
        </a>

        <div class="landing-header-icons">
          <button class="landing-icon-btn" aria-label="Search">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
          </button>
          <a href="${authed ? routes.account() : routes.login()}" class="landing-icon-btn" aria-label="${authed ? "Account" : "Sign in"}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
            </svg>
          </a>
          <a href="${routes.cart()}" class="landing-icon-btn" aria-label="Bag">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.25" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
            </svg>
            <span class="bag-count" data-cart-count>${cartCount}</span>
          </a>
        </div>
      </div>

      <!-- Dropdown panels — full-width, positioned just below the header -->
      ${renderDropdownPanel("dropdown-women", WOMEN_DROPDOWN)}
      ${renderDropdownPanel("dropdown-men", MEN_DROPDOWN)}
      ${renderDropdownPanel("dropdown-collections", COLLECTIONS_DROPDOWN)}
    </header>
  `;
}

// ─── Wire up live cart-count + dropdown behavior ────────────────────────────

export function initLandingHeader(): () => void {
  // 1. Live cart count
  const updateCount = () => {
    const node = document.querySelector<HTMLElement>("[data-cart-count]");
    if (node) node.textContent = String(cartStore.itemCount());
  };
  const cartUnsub = cartStore.subscribe(updateCount);
  updateCount();

  // 2. Dropdown navigation
  const root = document.querySelector<HTMLElement>("[data-nav-root]");
  if (!root) return cartUnsub;

  const triggers = Array.from(
    root.querySelectorAll<HTMLButtonElement>("[data-nav-trigger]")
  );
  const panels = Array.from(
    root.querySelectorAll<HTMLElement>("[data-dropdown-panel]")
  );

  let activeKey: string | null = null;
  let closeTimer: number | null = null;

  function panelFor(key: string): HTMLElement | null {
    return root!.querySelector<HTMLElement>("#dropdown-" + key);
  }
  function triggerFor(key: string): HTMLButtonElement | null {
    return root!.querySelector<HTMLButtonElement>(
      '[data-nav-trigger="' + key + '"]'
    );
  }

  function open(key: string) {
    if (closeTimer !== null) {
      window.clearTimeout(closeTimer);
      closeTimer = null;
    }
    if (activeKey === key) return;

    // Close any other open panel first
    if (activeKey) close(activeKey, true);

    const panel = panelFor(key);
    const trigger = triggerFor(key);
    if (!panel || !trigger) return;

    panel.hidden = false;
    // Force reflow so the transition runs
    void panel.offsetWidth;
    panel.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    trigger.classList.add("is-active");
    activeKey = key;
  }

  function close(key: string, immediate = false) {
    const panel = panelFor(key);
    const trigger = triggerFor(key);
    if (!panel || !trigger) return;

    panel.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
    trigger.classList.remove("is-active");

    if (immediate) {
      panel.hidden = true;
    } else {
      // Hide after the transition finishes
      window.setTimeout(() => {
        if (!panel.classList.contains("is-open")) panel.hidden = true;
      }, 180);
    }
    if (activeKey === key) activeKey = null;
  }

  function scheduleClose() {
    if (closeTimer !== null) window.clearTimeout(closeTimer);
    closeTimer = window.setTimeout(() => {
      if (activeKey) close(activeKey);
      closeTimer = null;
    }, 120);
  }

  // ── Hover behavior (desktop) ──
  triggers.forEach((trigger) => {
    const key = trigger.dataset.navTrigger!;
    const item = trigger.closest<HTMLElement>("[data-nav-item]");
    if (!item) return;

    item.addEventListener("mouseenter", () => open(key));
    item.addEventListener("mouseleave", scheduleClose);

    // Click to toggle (mobile / keyboard)
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (activeKey === key) close(key);
      else open(key);
    });
  });

  // Keep panel open while hovering it; close when leaving
  panels.forEach((panel) => {
    panel.addEventListener("mouseenter", () => {
      if (closeTimer !== null) {
        window.clearTimeout(closeTimer);
        closeTimer = null;
      }
    });
    panel.addEventListener("mouseleave", scheduleClose);

    // Clicking any link in the panel navigates and closes
    panel.addEventListener("click", (e) => {
      const link = (e.target as HTMLElement).closest<HTMLAnchorElement>("a");
      if (link && activeKey) close(activeKey, true);
    });
  });

  // ── Outside click + Esc ──
  function onDocClick(e: MouseEvent) {
    if (!activeKey) return;
    const target = e.target as HTMLElement;
    if (!root!.contains(target)) close(activeKey, true);
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape" && activeKey) close(activeKey, true);
  }
  document.addEventListener("click", onDocClick);
  document.addEventListener("keydown", onKey);

  // ── Cleanup ──
  return () => {
    cartUnsub();
    document.removeEventListener("click", onDocClick);
    document.removeEventListener("keydown", onKey);
    if (closeTimer !== null) window.clearTimeout(closeTimer);
  };
}