// ─── Manifesto ──────────────────────────────────────────────────────────────
// Editorial two-column block with a drop cap, kicker, and signature line.
// ────────────────────────────────────────────────────────────────────────────

export function renderManifesto(): string {
  return `
    <section class="manifesto">
      <div class="manifesto-left" data-reveal>
        <div class="kicker">Our Philosophy</div>
        <h2>Every piece<br>a small <em>ritual</em>.</h2>
      </div>

      <div class="manifesto-right" data-reveal>
        <p>
          We believe jewelry belongs to the quiet moments as much as the loud
          ones, the last thing you put on before closing the door. Made in small 
          batches from lab-grown diamonds and recycled silver, each piece is designed 
          to be worn daily, not saved for some other day.
        </p>
        <p>
          No pressure, no minimums, just thoughtful work you'll return to.
        </p>
        <div class="manifesto-sig">Jina — founder &amp; designer</div>
      </div>
    </section>
  `;
}