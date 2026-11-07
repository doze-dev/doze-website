// The registry catalog's behaviour: facets and sort over the module cards, and the
// "checked against your doze" state (counts, per-card newest release for you).
// The version itself is doze-check's: html[data-doze], set from ?doze= or the picker.
type Rel = { v: string; doze: string | null };
type Mod = { name: string; display: string; releases: Rel[] };

const data: Mod[] = JSON.parse(document.getElementById("rc-data")?.textContent ?? "[]");
const $$ = <E extends Element = HTMLElement>(s: string, root: ParentNode = document) =>
  [...root.querySelectorAll<E>(s)] as E[];

const older = (a: string, b: string) => {
  const pa = a.split(".").map(Number),
    pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) < (pb[i] ?? 0);
  return false;
};
const runs = (r: Rel, have: string) => !r.doze || !older(have, r.doze);

// ---- facets and sort (the catalog state)
const grid = document.querySelector<HTMLElement>("[data-rc-grid]");
const cards = $$("[data-rc-mod]");
function filter() {
  const show = (k: string) => document.querySelector<HTMLInputElement>(`[data-rc-show="${k}"]`)?.checked ?? true;
  for (const s of $$("[data-rc-section]")) s.hidden = !show(s.dataset.rcSection!);
  const cats = $$<HTMLInputElement>("[data-rc-cat]")
    .filter((i) => i.checked)
    .map((i) => i.dataset.rcCat!);
  const plats = $$<HTMLInputElement>("[data-rc-plat]")
    .filter((i) => i.checked)
    .map((i) => i.dataset.rcPlat!);
  const official = document.querySelector<HTMLInputElement>('[data-rc-tier="official"]')?.checked ?? true;
  let n = 0;
  for (const c of cards) {
    const have = (c.dataset.plat ?? "").split(" ");
    const ok = official && (!cats.length || cats.includes(c.dataset.cat!)) && plats.every((p) => have.includes(p));
    c.hidden = !ok;
    if (ok) n++;
  }
  const count = document.querySelector("[data-rc-count]");
  if (count) count.textContent = String(n);
  const empty = document.querySelector<HTMLElement>("[data-rc-empty]");
  if (empty) empty.hidden = n > 0;
}
function sort(by: string) {
  if (!grid) return;
  const sorted = [...cards].sort((a, b) =>
    by === "recent"
      ? (b.dataset.date ?? "").localeCompare(a.dataset.date ?? "") || a.dataset.title!.localeCompare(b.dataset.title!)
      : a.dataset.title!.localeCompare(b.dataset.title!),
  );
  for (const c of sorted) grid.append(c);
}
document.addEventListener("change", (e) => {
  const t = e.target as HTMLElement;
  if (t.matches("[data-rc-sort]")) sort((t as HTMLSelectElement).value);
  else if (t.closest("[data-rc-filters]")) filter();
});
document.querySelector("[data-rc-reset]")?.addEventListener("click", () => {
  for (const i of $$<HTMLInputElement>("[data-rc-cat], [data-rc-plat]")) i.checked = false;
  for (const i of $$<HTMLInputElement>("[data-rc-show], [data-rc-tier]")) i.checked = true;
  filter();
});
// Phone: the facets open under the Filters button.
const filtersBtn = document.querySelector<HTMLButtonElement>("[data-rc-filters-btn]");
filtersBtn?.addEventListener("click", () => {
  const aside = document.getElementById("rc-filters");
  const open = !aside?.classList.contains("open");
  aside?.classList.toggle("open", open);
  filtersBtn.setAttribute("aria-expanded", String(open));
});
// "Runs on my doze" needs a version: open the picker in the bar to set one.
document.querySelector("[data-rc-runs]")?.addEventListener("click", () => {
  const pick = document.querySelector<HTMLDetailsElement>(".rb-pick");
  if (!pick) return;
  pick.open = true;
  pick.querySelector("summary")?.focus();
  pick.scrollIntoView({ block: "nearest" });
});
// Back/forward or a restored form can leave boxes ticked: apply them.
const sortSel = document.querySelector<HTMLSelectElement>("[data-rc-sort]");
if (sortSel && sortSel.value !== "name") sort(sortSel.value);
filter();

// ---- checked against the reader's doze
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
const list = (xs: string[]) =>
  xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`;

function check(have: string | undefined) {
  if (!have) return;
  let nRuns = 0,
    nPart = 0,
    nNone = 0;
  const needFor = new Set<string>();
  for (const m of data) {
    const card = document.querySelector<HTMLElement>(`[data-fy-mod="${m.name}"]`);
    if (!card) continue;
    const newest = m.releases[0];
    const fit = m.releases.find((r) => runs(r, have));
    const state = !newest || fit === newest ? "runs" : fit ? "part" : "none";
    if (state === "runs") nRuns++;
    else if (state === "part") nPart++;
    else nNone++;
    if (state !== "runs" && newest?.doze) needFor.add(newest.doze);
    card.classList.toggle("part", state === "part");
    card.classList.toggle("none", state === "none");
    for (const chip of $$("[data-fy-chip]", card)) chip.hidden = chip.dataset.fyChip !== state;
    for (const row of $$("[data-fy-rel]", card)) {
      const v = row.dataset.fyRel;
      const shown = v === newest?.v || v === fit?.v;
      row.hidden = !shown;
      const ok = !row.dataset.fyNeeds || !older(have, row.dataset.fyNeeds);
      row.classList.toggle("old", !ok);
      const say = row.querySelector("[data-fy-say]");
      if (say) say.textContent = ok ? "runs on yours" : `needs doze ${row.dataset.fyNeeds}`;
    }
    const nothing = card.querySelector<HTMLElement>("[data-fy-nothing]");
    if (nothing) nothing.hidden = state !== "none";
  }
  const total = data.length;
  const set = (sel: string, text: string) => {
    for (const el of $$(sel)) el.textContent = text;
  };
  set('[data-fy-n="runs"]', String(nRuns));
  set('[data-fy-n="part"]', String(nPart));
  set('[data-fy-n="none"]', String(nNone));
  set(
    "[data-fy-headline]",
    nRuns === total ? `All ${total} newest releases run on it.` : `${nRuns} of ${total} newest releases run on it.`,
  );

  const anyDoze = data.filter((m) => m.releases.every((r) => !r.doze)).map((m) => m.display);
  const parts: string[] = [];
  if (nRuns === total) parts.push("Every module's newest release runs on yours, so nothing here is greyed out.");
  if (nPart) {
    const need = [...needFor].sort();
    parts.push(
      `For ${plural(nPart, "module", "modules")} the newest release needs doze ${need.join(" or ")}; an older one still runs on yours${nNone ? "" : ", so every module has something you can use"}.`,
    );
  }
  if (nNone)
    parts.push(
      `${plural(nNone, "module has", "modules have")} no release that runs on yours: update doze to use ${nNone === 1 ? "it" : "them"}.`,
    );
  if (anyDoze.length === total)
    parts.push("No release in the index is stamped with an oldest doze yet, so each one runs on any doze.");
  else if (anyDoze.length) parts.push(`${list(anyDoze)} run${anyDoze.length === 1 ? "s" : ""} on any doze.`);
  if (nRuns < total) parts.push("Struck-through lines are releases yours can't run.");
  set("[data-fy-summary]", parts.join(" "));
}

new MutationObserver(() => check(document.documentElement.dataset.doze)).observe(document.documentElement, {
  attributes: true,
  attributeFilter: ["data-doze"],
});
check(document.documentElement.dataset.doze);

export {};
