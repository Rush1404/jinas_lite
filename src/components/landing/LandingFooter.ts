// ─── Landing Footer ─────────────────────────────────────────────────────────
// Brand block, link columns, newsletter input, and legal row.
// Newsletter submit is a stub — hook to your email service later.
// ────────────────────────────────────────────────────────────────────────────

const arrowSvg = `
  <svg width="16" height="12" viewBox="0 0 14 10" fill="none">
    <path d="M1 5h12M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`;

export function renderLandingFooter(): string {
  return `
    <footer class="landing-footer">
      <div class="footer-top">
        <div class="footer-brand">
          <a href="/" class="landing-logo footer-logo">
            Jina<span class="dot"></span>s<em>&nbsp;Lite</em>
          </a>
          <p>
            Lab-grown diamond jewelry, made in small batches. Designed in
            Toronto, crafted to last a lifetime of daily wear.
          </p>
        </div>

        <div class="footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="#">All Jewelry</a></li>
            <li><a href="#">Collections</a></li>
            <li><a href="#">New Arrivals</a></li>
            <li><a href="#">Bestsellers</a></li>
          </ul>
        </div>

        <div class="footer-col">
          <h4>Care</h4>
          <ul>
            <li><a href="#">Contact</a></li>
            <li><a href="#">Shipping</a></li>
            <li><a href="#">Returns</a></li>
            <li><a href="#">Jewelry Care</a></li>
          </ul>
        </div>

        <div class="footer-col newsletter">
          <h4>Newsletter</h4>
          <label>New arrivals, small batches, first access — never spam.</label>
          <form class="newsletter-input" id="newsletter-form">
            <input type="email" placeholder="your@email.com" required />
            <button type="submit" aria-label="Subscribe">${arrowSvg}</button>
          </form>
        </div>
      </div>

      <div class="footer-bottom">
        <div>© 2026 Jina's Lite</div>
        <div>Toronto, Ontario</div>
        <div>Privacy · Terms</div>
      </div>
    </footer>
  `;
}

export function initFooterEvents() {
  const form = document.getElementById("newsletter-form") as HTMLFormElement | null;
  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = form.querySelector<HTMLInputElement>('input[type="email"]');
    if (!input) return;
    // TODO: wire to real email service (Mailchimp, Beehiiv, Supabase table, etc.)
    console.log("Newsletter signup:", input.value);
    input.value = "";
    input.placeholder = "Thank you — we'll be in touch.";
  });
}