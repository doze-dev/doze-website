// A Tuesday, honestly (/tuesday/): every scene and both views are in the page;
// this flips between them. State: which moment (0–5, 6 = the whole day) and
// which view ("How it is" or "With doze").
const root = document.querySelector<HTMLElement>("[data-story]");
if (root) {
  const LAST = 5;
  const meters = [
    [7, 0, 9, 0],
    [7, 8, 9, 0],
    [7, 8, 9, 0],
    [7, 8, 9, 0],
    [7, 8, 9, 0],
    [7, 8, 9, 23],
  ];
  const dozeMeter = [1, 0, 1, 0];
  const dozeNote = ["doze up", "every service has a name", "doze.hcl", "everything idle is asleep"];
  const all = <T extends HTMLElement>(sel: string) => [...root.querySelectorAll<T>(sel)];
  const one = <T extends HTMLElement>(sel: string) => root.querySelector<T>(sel);
  const stops = all<HTMLButtonElement>("[data-stop]");
  const scenes = all("[data-scene]");
  const day = one("[data-day]");
  const end = one("[data-end]");
  const seg = { before: one('[data-act="before"]'), doze: one('[data-act="doze"]') };
  const next = one('[data-act="next"]');
  const prev = one('[data-act="prev"]');
  const meterTitle = one("[data-meter-title]");
  const cells = all(".st-m");
  let at = 0;
  let doze = false;

  const render = () => {
    const done = at > LAST;
    stops.forEach((b, i) => {
      b.classList.toggle("on", i === at);
      b.classList.toggle("done", i < at);
      b.setAttribute("aria-pressed", String(i === at));
    });
    if (day) day.hidden = done;
    if (end) end.hidden = !done;
    scenes.forEach((s, i) => {
      s.hidden = i !== at;
    });
    for (const m of all("[data-mode]")) m.hidden = m.dataset.mode !== (doze ? "doze" : "before");
    seg.before?.classList.toggle("on", !doze);
    seg.before?.setAttribute("aria-pressed", String(!doze));
    seg.doze?.classList.toggle("on", doze);
    seg.doze?.setAttribute("aria-pressed", String(doze));
    if (next) next.textContent = doze ? (at === LAST ? "See the whole day →" : "Next moment →") : "Now with doze →";
    prev?.setAttribute("aria-disabled", String(at === 0 && !doze));
    if (meterTitle) meterTitle.textContent = doze ? "The mess meter, with doze" : "The mess meter, so far today";
    const cur = meters[Math.min(at, LAST)];
    cells.forEach((c, i) => {
      const b = c.querySelector("b");
      const note = c.querySelector("small");
      const n = doze ? dozeMeter[i] : cur[i];
      if (b) {
        b.textContent = String(n);
        b.className = doze ? "st-m-doze" : n ? "st-m-bad" : "st-m-zero";
      }
      if (note) note.textContent = doze ? dozeNote[i] : "";
    });
  };

  const go = (i: number, d: boolean) => {
    at = i;
    doze = d;
    render();
  };

  root.addEventListener("click", (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>("button");
    if (!btn || !root.contains(btn)) return;
    if (btn.dataset.stop) return go(Number(btn.dataset.stop), false);
    switch (btn.dataset.act) {
      case "before":
        return go(at, false);
      case "doze":
        return go(at, true);
      case "next":
        if (!doze) return go(at, true);
        go(at + 1, false);
        if (at > LAST) one("[data-end-title]")?.focus();
        return;
      case "prev":
        if (doze) return go(at, false);
        if (at > 0) go(at - 1, true);
        return;
      case "restart":
        go(0, false);
        stops[0]?.focus();
        return;
    }
  });
}
