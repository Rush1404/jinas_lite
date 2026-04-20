// ─── Custom cursor ──────────────────────────────────────────────────────────
// A dot + trailing ring that follows the mouse.
// - Grows on hover over any .btn, a, button
// - Transforms into a dark "VIEW" label on elements with [data-product-cursor]
// - Auto-disables on touch devices
// ────────────────────────────────────────────────────────────────────────────

interface CursorHandle {
  destroy: () => void;
}

export function initCustomCursor(): CursorHandle | null {
  // Skip on touch-only devices
  if (window.matchMedia("(hover: none)").matches) {
    document.body.classList.add("cursor-disabled");
    return null;
  }

  // Build elements
  const dot = document.createElement("div");
  dot.className = "cursor-dot";
  const ring = document.createElement("div");
  ring.className = "cursor-ring";
  document.body.appendChild(dot);
  document.body.appendChild(ring);

  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx;
  let ry = my;
  let rafId = 0;

  const onMove = (e: MouseEvent) => {
    mx = e.clientX;
    my = e.clientY;
    dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%, -50%)`;
  };

  const tick = () => {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(tick);
  };

  const onLeave = () => {
    dot.style.opacity = "0";
    ring.style.opacity = "0";
  };
  const onEnter = () => {
    dot.style.opacity = "1";
    ring.style.opacity = "1";
  };

  // Hover state management — delegated so it picks up dynamically rendered elements
  const onOver = (e: Event) => {
    const target = (e.target as HTMLElement).closest(
      "a, button, [data-product-cursor]"
    );
    if (!target) return;

    if ((target as HTMLElement).hasAttribute("data-product-cursor")) {
      document.body.classList.add("cursor-view");
    } else {
      document.body.classList.add("cursor-hover");
    }
  };

  const onOut = (e: Event) => {
    const target = (e.target as HTMLElement).closest(
      "a, button, [data-product-cursor]"
    );
    if (!target) return;
    document.body.classList.remove("cursor-hover", "cursor-view");
  };

  window.addEventListener("mousemove", onMove);
  document.addEventListener("mouseleave", onLeave);
  document.addEventListener("mouseenter", onEnter);
  document.addEventListener("mouseover", onOver);
  document.addEventListener("mouseout", onOut);
  rafId = requestAnimationFrame(tick);

  return {
    destroy() {
      cancelAnimationFrame(rafId);
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseover", onOver);
      document.removeEventListener("mouseout", onOut);
      dot.remove();
      ring.remove();
      document.body.classList.remove("cursor-hover", "cursor-view");
    },
  };
}