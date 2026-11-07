// Changelog filter chips: show only one product's releases. Every entry is in
// the page; without script all of them show.
const chips = [...document.querySelectorAll<HTMLButtonElement>("[data-cl-filter]")];
const entries = [...document.querySelectorAll<HTMLElement>("[data-cl-product]")];
for (const chip of chips) {
  chip.addEventListener("click", () => {
    const want = chip.dataset.clFilter;
    for (const c of chips) c.setAttribute("aria-pressed", String(c === chip));
    for (const e of entries) e.hidden = want !== "all" && e.dataset.clProduct !== want;
  });
}
