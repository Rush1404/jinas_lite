import "./styles/main.css";
import "./styles/landing.css";
import "./styles/shop.css";
import "./styles/collection-overrides.css";
import "./styles/admin.css";
import "./styles/account-cart.css";

import { mockProducts } from "./data/products.ts";

// Landing
import {
  renderLandingPage,
  initLandingPage,
  cleanupLandingPage,
} from "./components/landing/LandingPage.ts";

// Category + product
import {
  renderCategoryPage,
  renderGenderPage,
  initCategoryPageEvents,
} from "./components/category/CategoryPage.ts";
import {
  renderProductPage,
  initProductPageEvents,
  cleanupProductPage,
} from "./components/product/ProductPage.ts";

// Shared chrome
import { renderAnnounceBar } from "./components/landing/AnnounceBar.ts";
import {
  renderLandingHeader,
  initLandingHeader,
} from "./components/landing/LandingHeader.ts";
import {
  renderLandingFooter,
  initFooterEvents,
} from "./components/landing/LandingFooter.ts";

// Auth
import {
  renderLoginPage,
  initLoginPage,
} from "./components/auth/LoginPage.ts";
import {
  renderAccountPage,
  initAccountPage,
} from "./components/auth/AccountPage.ts";

// Cart / checkout
import {
  renderCartPage,
  initCartPage,
  cleanupCartPage,
} from "./components/cart/CartPage.ts";
import {
  renderCheckoutPage,
  initCheckoutPage,
  renderOrderSuccessPage,
} from "./components/cart/CheckoutPage.ts";

// Admin
import {
  renderAdminListPage,
  initAdminListPage,
} from "./components/admin/AdminListPage.ts";
import {
  renderAdminFormPage,
  initAdminFormPage,
} from "./components/admin/AdminFormPage.ts";

// Stores + utils
import { authStore } from "./lib/authStore.ts";
import { initCustomCursor } from "./utils/cursor.ts";
import { initScrollReveal } from "./utils/reveal.ts";
import { parseRoute, onRouteChange, type Route } from "./utils/router.ts";

// ─── State ──────────────────────────────────────────────────────────────────
let cursorHandle: { destroy: () => void } | null = null;
let revealHandle: { destroy: () => void } | null = null;
let cartHeaderUnsub: (() => void) | null = null;

const app = document.querySelector<HTMLDivElement>("#app")!;

// ─── Bootstrap ──────────────────────────────────────────────────────────────
authStore.init().then(() => {
  // Re-render whenever auth changes (header swaps account/sign-in icon)
  authStore.subscribe(() => renderCurrentRoute());
});

onRouteChange(() => renderCurrentRoute());
renderCurrentRoute();

// ─── Lifecycle ──────────────────────────────────────────────────────────────
function teardown() {
  cursorHandle?.destroy();
  revealHandle?.destroy();
  cartHeaderUnsub?.();

  cursorHandle = null;
  revealHandle = null;
  cartHeaderUnsub = null;

  cleanupLandingPage();
  cleanupProductPage();
  cleanupCartPage();

  document.body.style.overflow = "";
  document.body.classList.remove("landing-mode");
  window.scrollTo(0, 0);
}

function mountEditorialShell(mainHtml: string) {
  document.body.classList.add("landing-mode");
  app.innerHTML = `
    ${renderAnnounceBar()}
    ${renderLandingHeader()}
    <main class="landing-main">
      ${mainHtml}
    </main>
    ${renderLandingFooter()}
  `;
  cursorHandle = initCustomCursor();
  revealHandle = initScrollReveal();
  initFooterEvents();
  cartHeaderUnsub = initLandingHeader();
}

// ─── Dispatch ───────────────────────────────────────────────────────────────
function renderCurrentRoute() {
  const route = parseRoute();
  teardown();

  switch (route.kind) {
    case "landing":
      renderLanding();
      break;
    case "category":
      renderCategory(route);
      break;
    case "gender":
      renderGender(route);
      break;
    case "product":
      renderProduct(route);
      break;
    case "cart":
      renderCart();
      break;
    case "checkout":
      renderCheckout();
      break;
    case "order-success":
      renderOrderSuccess(route.orderId);
      break;
    case "login":
      renderLogin();
      break;
    case "account":
      renderAccount();
      break;
    case "admin":
      renderAdmin(route);
      break;
  }
}

// ─── Routes ─────────────────────────────────────────────────────────────────
function renderLanding() {
  document.body.classList.add("landing-mode");
  app.innerHTML = renderLandingPage();
  initLandingPage();
  cartHeaderUnsub = initLandingHeader();
}

function renderCategory(route: Extract<Route, { kind: "category" }>) {
  mountEditorialShell(renderCategoryPage(route.subCategory, mockProducts));
  initCategoryPageEvents(mockProducts);
}

function renderGender(route: Extract<Route, { kind: "gender" }>) {
  mountEditorialShell(renderGenderPage(route.gender, mockProducts));
  initCategoryPageEvents(mockProducts);
}

function renderProduct(route: Extract<Route, { kind: "product" }>) {
  const product = mockProducts.find(
    (p) => p.sku.toUpperCase() === route.sku.toUpperCase()
  );

  if (!product) {
    mountEditorialShell(`
      <section class="category-page">
        <div class="cat-empty" style="padding: 120px 24px;">
          <h1 style="font-family: var(--landing-display); font-size: 48px; font-weight: 300; color: var(--ink);">
            Not found
          </h1>
          <p>We couldn't find a piece with SKU <strong>${route.sku}</strong>.</p>
          <a href="#/" class="btn-ghost"><span>Back to home</span></a>
        </div>
      </section>
    `);
    return;
  }

  mountEditorialShell(renderProductPage(product, mockProducts));
  initProductPageEvents(product, mockProducts);
}

function renderCart() {
  mountEditorialShell(renderCartPage());
  initCartPage();
}

function renderCheckout() {
  mountEditorialShell(renderCheckoutPage());
  initCheckoutPage();
}

function renderOrderSuccess(orderId: string) {
  mountEditorialShell(renderOrderSuccessPage(orderId));
}

function renderLogin() {
  mountEditorialShell(renderLoginPage());
  initLoginPage();
}

function renderAccount() {
  mountEditorialShell(renderAccountPage());
  initAccountPage();
}

function renderAdmin(route: Extract<Route, { kind: "admin" }>) {
  if (route.section === "new") {
    mountEditorialShell(renderAdminFormPage("new"));
    initAdminFormPage("new");
  } else if (route.section === "edit" && route.sku) {
    mountEditorialShell(renderAdminFormPage("edit", route.sku));
    initAdminFormPage("edit", route.sku);
  } else {
    mountEditorialShell(renderAdminListPage());
    initAdminListPage();
  }
}