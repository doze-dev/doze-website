// Home: recordings play only while they are on screen, and not at all when the
// reader asks for less motion (then they show their first frame and controls).
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-home-play]")];

if (reduce || !("IntersectionObserver" in window)) {
  for (const v of videos) {
    v.removeAttribute("autoplay");
    v.pause();
    if (reduce) v.controls = true;
  }
} else {
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const v = e.target as HTMLVideoElement;
        if (e.isIntersecting) {
          if (v.preload === "none") v.preload = "auto";
          v.play().catch(() => {});
        } else v.pause();
      }
    },
    { threshold: 0.25 },
  );
  for (const v of videos) io.observe(v);
}
