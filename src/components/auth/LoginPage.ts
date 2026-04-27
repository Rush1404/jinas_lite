// ─── Login / Signup Page ────────────────────────────────────────────────────
// Toggles between sign in and sign up modes. On success, navigates to /account.
// ────────────────────────────────────────────────────────────────────────────

import { authStore } from "../../lib/authStore";
import { routes, navigate } from "../../utils/router";

export function renderLoginPage(): string {
  return `
    <section class="auth-page">
      <div class="auth-card">
        <h1 class="auth-title" data-reveal>Welcome.</h1>
        <p class="auth-sub" data-reveal>Sign in or create an account to track orders and check out faster.</p>

        <div class="auth-tabs">
          <button class="auth-tab active" data-mode="signin">Sign in</button>
          <button class="auth-tab" data-mode="signup">Create account</button>
        </div>

        <form class="auth-form" id="auth-form" novalidate>
          <label class="auth-field">
            <span>Email</span>
            <input type="email" name="email" required autocomplete="email" />
          </label>

          <label class="auth-field">
            <span>Password</span>
            <input type="password" name="password" required minlength="6" autocomplete="current-password" />
          </label>

          <p class="auth-error" id="auth-error" hidden></p>

          <button type="submit" class="auth-submit">
            <span data-submit-label>Sign in</span>
          </button>
        </form>

        <p class="auth-aside">
          Trouble signing in? <a href="mailto:hello@jinaslite.com">Email us</a>.
        </p>
      </div>
    </section>
  `;
}

export function initLoginPage() {
  const form = document.getElementById("auth-form") as HTMLFormElement | null;
  const tabs = document.querySelectorAll<HTMLButtonElement>(".auth-tab");
  const errorEl = document.getElementById("auth-error") as HTMLParagraphElement | null;
  const submitLabel = document.querySelector("[data-submit-label]") as HTMLElement | null;
  const passwordInput = form?.querySelector<HTMLInputElement>('input[name="password"]');

  if (!form || !errorEl || !submitLabel) return;

  let mode: "signin" | "signup" = "signin";

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      mode = (tab.dataset.mode as "signin" | "signup") ?? "signin";
      submitLabel.textContent = mode === "signin" ? "Sign in" : "Create account";
      if (passwordInput) {
        passwordInput.autocomplete = mode === "signin" ? "current-password" : "new-password";
      }
      errorEl.hidden = true;
    });
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const data = new FormData(form);
    const email = String(data.get("email") || "").trim();
    const password = String(data.get("password") || "");

    if (!email || password.length < 6) {
      errorEl.textContent = "Please enter a valid email and a password of 6+ characters.";
      errorEl.hidden = false;
      return;
    }

    try {
      const { error } =
        mode === "signin"
          ? await authStore.signIn(email, password)
          : await authStore.signUp(email, password);

      if (error) {
        errorEl.textContent = error.message;
        errorEl.hidden = false;
        return;
      }

      if (mode === "signup") {
        // Supabase may require email confirmation depending on project settings.
        errorEl.textContent =
          "Account created. Check your email if confirmation is required, then sign in.";
        errorEl.hidden = false;
        return;
      }

      navigate(routes.account());
    } catch (err: any) {
      errorEl.textContent = err?.message ?? "Something went wrong";
      errorEl.hidden = false;
    }
  });
}