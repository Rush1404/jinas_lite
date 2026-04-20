// ─── Scroll reveal ──────────────────────────────────────────────────────────
// Watches all [data-reveal] elements; adds `.in` when they enter the viewport.
// Pair with CSS that animates opacity/transform on `.in`.
// ────────────────────────────────────────────────────────────────────────────

interface RevealHandle {
  destroy: () => void;
}

export function initScrollReveal(
  selector: string = "[data-reveal]"
): RevealHandle {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  document.querySelectorAll(selector).forEach((el) => io.observe(el));

  return {
    destroy() {
      io.disconnect();
    },
  };
}