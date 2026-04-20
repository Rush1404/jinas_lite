// ─── Announce Bar ───────────────────────────────────────────────────────────
// A continuously scrolling marquee at the very top of the page.
// Items repeat so the animation loops seamlessly.
// ────────────────────────────────────────────────────────────────────────────

const ANNOUNCEMENTS = [
  "Complimentary shipping on orders over $150",
  "Lab grown, ethically sourced diamonds",
  "New — The Eternity Collection",
];

export function renderAnnounceBar(): string {
  // Double the items so the marquee loops without a visible gap
  const items = [...ANNOUNCEMENTS, ...ANNOUNCEMENTS]
    .map((text) => `<span>${text}</span>`)
    .join("");

  return `
    <div class="announce-bar">
      <div class="announce-track">${items}</div>
    </div>
  `;
}