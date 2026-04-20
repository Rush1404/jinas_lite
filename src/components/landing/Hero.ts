// ─── Hero ───────────────────────────────────────────────────────────────────
// Split-screen hero: editorial copy on the left, full-bleed photo on the right.
// Word-by-word reveal on the title, slow zoom on the photo, floating product tag.
// ────────────────────────────────────────────────────────────────────────────

export interface HeroConfig {
  kicker: string;
  /** The title rendered as words wrapped in <span class="word"> for per-word reveal.
   *  Use <em> to italicize any portion; use <br> to break lines. */
  titleHtml: string;
  lede: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
  image: { src: string; alt: string };
  sideText: string;
  tag: { title: string; meta: string };
}

const defaultConfig: HeroConfig = {
  kicker: "The Spring Edit — 2026",
  titleHtml: `
    <span class="word"><span>Quiet</span></span>
    <span class="word"><span>light,</span></span>
    <br />
    <span class="word"><span><em>made</em></span></span>
    <span class="word"><span>to last.</span></span>
  `,
  lede:
    "Lab-grown diamonds, silver 925, and gold vermeil, designed in small batches for the quiet rituals of daily dress.",
  primaryCta: { label: "Shop the edit", href: "#" },
  secondaryCta: { label: "Our story", href: "#" },
  image: {
    src: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=1600&q=80",
    alt: "A model wearing a delicate diamond pendant in soft natural light",
  },
  sideText: "Lab grown · 925 silver · 18k vermeil",
  tag: { title: "Eternity Pendant №04", meta: "1.08 ct · 14k gold vermeil" },
};

const arrowSvg = `
  <svg width="14" height="10" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 5H13M13 5L9 1M13 5L9 9" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>
`;

export function renderHero(config: HeroConfig = defaultConfig): string {
  return `
    <section class="hero">
      <div class="hero-copy">
        <div class="hero-kicker">${config.kicker}</div>

        <h1 class="hero-title">${config.titleHtml}</h1>

        <p class="hero-lede">${config.lede}</p>

        <div class="hero-ctas">
          <a href="${config.primaryCta.href}" class="btn-primary">
            <span>${config.primaryCta.label}</span>
            ${arrowSvg}
          </a>
          <a href="${config.secondaryCta.href}" class="btn-ghost">
            <span>${config.secondaryCta.label}</span>
          </a>
        </div>
      </div>

      <div class="hero-visual">
        <div class="hero-side-text">${config.sideText}</div>
        <img src="${config.image.src}" alt="${config.image.alt}" />
        <div class="hero-tag">
          <strong>${config.tag.title}</strong>
          ${config.tag.meta}
        </div>
      </div>
    </section>
  `;
}