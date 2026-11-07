export {};

// Reveal: elements with [data-reveal] fade and rise once as they enter the
// viewport. Without script, or with reduced motion, they are simply there.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const els = document.querySelectorAll<HTMLElement>("[data-reveal]");
if (!reduce && "IntersectionObserver" in window) {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries)
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
    },
    { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
  );
  for (const el of els) {
    el.classList.add("rv");
    io.observe(el);
  }
}
