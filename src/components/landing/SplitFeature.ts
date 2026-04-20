// ─── Split Feature ──────────────────────────────────────────────────────────
// Full-bleed two-column: big product photo on the left, dark content panel
// on the right. Modeled after the "Puzzle" block on Mejuri.
// ────────────────────────────────────────────────────────────────────────────

export interface SplitConfig {
  kicker: string;
  titleHtml: string;
  body: string;
  cta: { label: string; href: string };
  image: { src: string; alt: string };
}

const defaultConfig: SplitConfig = {
  kicker: "New Collection",
  titleHtml: "The <em>Eternity</em><br>Collection",
  body:
    "Twelve pieces exploring how far a single line can travel. Each one designed to stack, layer, and grow with you without ever competing for attention.",
  cta: { label: "Shop the collection", href: "#" },
  image: {
    src: "https://images.unsplash.com/photo-1633934542430-0905ccb5f050?q=80",
    alt: "The Eternity Collection",
  },
};

export function renderSplitFeature(config: SplitConfig = defaultConfig): string {
  return `
    <section class="split">
      <div class="split-image">
        <img src="${config.image.src}" alt="${config.image.alt}" loading="lazy" />
      </div>
      <div class="split-content">
        <div class="kicker">${config.kicker}</div>
        <h2>${config.titleHtml}</h2>
        <p>${config.body}</p>
        <a href="${config.cta.href}" class="btn-ghost">
          <span>${config.cta.label}</span>
        </a>
      </div>
    </section>
  `;
}