export {};

// The long way round. An IntersectionObserver picks the beat in the reading
// band; that beat's data-* attributes are a COMPLETE stage state (where each
// thing runs, the walls in between, the fan, the wait, the bill), so jumps,
// fast scrolls and deep links land on the right picture. Reduced motion: no
// pinning; each beat gets a still copy of the stage. Same mechanics as
// scripts/tuesday.ts.

const root = document.querySelector<HTMLElement>("[data-lw]");
if (root) init(root);

function init(lw: HTMLElement) {
  lw.classList.add("lw-js");
  const stage = lw.querySelector<HTMLElement>("[data-stage]");
  if (!stage) return;
  const beats = [...lw.querySelectorAll<HTMLElement>("[data-step]")].filter((el) => !el.closest("[data-stage]"));
  const rail = [...lw.querySelectorAll<HTMLAnchorElement>("[data-rail]")];
  const order = rail.map((a) => a.dataset.rail);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const phone = matchMedia("(max-width: 900px)");
  const fanWords = ["off", "whirring", "loud", "roaring"];
  const billWords = ["none", "by the hour", "per environment", "+ a team"];
  const ids = ["ed", "web", "api", "worker", "db", "queue"];
  const words: Record<string, string> = {
    on: "awake",
    sleep: "asleep| · wakes when called",
    pause: "paused| on your breakpoint",
    down: "down",
  };
  let current: HTMLElement | null = null;

  // Where a thing sits on the map, in % of the map: the same sums as the
  // CSS (.lw-chip --x/--y), from the same variables, so the tethers meet the chips.
  function at(d: number, i: number): [number, number] {
    const cs = getComputedStyle(lw);
    const v = (n: string) => Number(cs.getPropertyValue(n)) || 0;
    const b0 = v("--b0"),
      bw = v("--bw");
    return [b0 / 2 + d * bw + Math.min(d, 1) * (b0 / 2 - bw / 2), v("--r0") + i * v("--rs")];
  }

  // Paint one stage from one beat: everything, never a delta.
  function paint(st: HTMLElement, beat: HTMLElement, still = false) {
    const d = beat.dataset;
    const id = d.step ?? "";
    const was = st.dataset.d;
    st.dataset.step = id;
    st.dataset.fan = d.fan ?? "0";
    st.dataset.lid = d.lid ?? "open";
    st.dataset.light = d.light ?? "";
    st.dataset.person = d.person ?? "";
    st.dataset.laptop = d.laptop ?? "";
    st.dataset.d = d.d ?? "";
    for (const el of st.querySelectorAll<HTMLElement>("[data-in]")) {
      el.classList.toggle("on", (el.dataset.in ?? "").split(" ").includes(id));
    }

    // where everything runs, and in what state
    const dist = (d.d ?? "0,0,0,0,0,0").split(",").map(Number);
    const states = ["on", ...(d.s ?? "").split(",")];
    ids.forEach((t, i) => {
      const chip = st.querySelector<HTMLElement>(`[data-t="${t}"]`);
      if (!chip) return;
      chip.style.setProperty("--d", String(dist[i]));
      chip.dataset.dist = String(dist[i]);
      chip.dataset.s = states[i] || "on";
      const word = st.querySelector<HTMLElement>(`[data-addr="${t}"] [data-word]`);
      if (word) {
        const [w, more = ""] = (i === 0 ? "same machine| as everything else" : (words[chip.dataset.s] ?? "")).split(
          "|",
        );
        word.textContent = w;
        word.dataset.more = more;
      }
    });

    // the walls, and the meter that counts them
    const chain = d.chain ? d.chain.split("|") : [];
    for (const band of st.querySelectorAll<HTMLElement>("[data-band]")) {
      const k = Number(band.dataset.band);
      band.classList.toggle("on", k <= chain.length);
      const label = band.querySelector("[data-band-label]");
      if (label) label.textContent = chain[k - 1] ?? "";
    }
    const hops = st.querySelector("[data-hops]");
    if (hops) hops.textContent = String(chain.length);
    const hw = st.querySelector("[data-hops-word]");
    if (hw) hw.textContent = chain.length === 1 ? "wall" : "walls";
    const list = st.querySelector("[data-chain]");
    if (list) {
      const items = ["you", ...chain, "your code"];
      list.replaceChildren(
        ...items.map((name, i) => {
          const li = document.createElement("li");
          if (i === 0 || i === items.length - 1) {
            li.className = "end";
            li.textContent = name;
          } else {
            const b = document.createElement("b");
            b.textContent = name;
            li.append(b);
            if (name === "a ticket") li.className = "person";
          }
          return li;
        }),
      );
      list.classList.toggle("none", chain.length === 0);
    }

    // the tethers: from you to the editor, from the editor to each service
    const ed = at(dist[0], 0);
    const you = at(0, 0);
    for (const line of st.querySelectorAll<SVGLineElement>("[data-line]")) {
      const t = line.dataset.line ?? "";
      const i = ids.indexOf(t);
      const [a, b] = t === "you" ? [you, ed] : [ed, at(dist[i], i)];
      const far = t === "you" ? dist[0] : dist[i];
      line.setAttribute("x1", String(a[0]));
      line.setAttribute("y1", String(a[1]));
      line.setAttribute("x2", String(b[0]));
      line.setAttribute("y2", String(b[1]));
      line.classList.toggle("on", far > 0 && (t !== "you" || dist[0] > 0));
      line.classList.toggle("tunnel", far >= 3);
    }
    // lines jump, chips glide: hide the lines while the chips are moving
    if (!still && was !== undefined && was !== st.dataset.d) {
      st.classList.add("lw-moving");
      clearTimeout(Number(st.dataset.mt ?? 0));
      st.dataset.mt = String(setTimeout(() => st.classList.remove("lw-moving"), 820));
    }

    // the strip
    const fw = st.querySelector("[data-fan-word]");
    if (fw) fw.textContent = fanWords[Number(d.fan ?? 0)] ?? "off";
    const wt = st.querySelector("[data-wait]");
    if (wt) wt.textContent = d.wait ?? "nobody";
    const bill = Number(d.bill ?? 0);
    st.dataset.bill = String(bill);
    const bw = st.querySelector("[data-bill-word]");
    if (bw) bw.textContent = billWords[bill] ?? "none";
  }

  function activate(beat: HTMLElement) {
    if (beat === current) return;
    current = beat;
    paint(stage as HTMLElement, beat);
    lw.dataset.light = beat.dataset.light ?? "warm";
    for (const b of beats) b.classList.toggle("on", b === beat);
    const ch = order.indexOf(beat.dataset.ch);
    rail.forEach((a, i) => {
      if (i === ch) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");
      a.classList.toggle("past", i < ch);
    });
  }

  // Which beat is in the reading band (middle on desktop, lower on phone).
  let io: IntersectionObserver | null = null;
  function observe() {
    io?.disconnect();
    const band = phone.matches ? "-70% 0px -24% 0px" : "-46% 0px -46% 0px";
    io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).pop();
        if (hit) activate(hit.target as HTMLElement);
      },
      { rootMargin: band },
    );
    for (const b of beats) io.observe(b);
  }
  observe();
  phone.addEventListener("change", () => {
    observe();
    if (current) paint(stage as HTMLElement, current, true);
    for (const s of lw.querySelectorAll<HTMLElement>(".lw-still")) {
      const b = s.closest<HTMLElement>("[data-step]");
      if (b) paint(s, b, true);
    }
  });
  activate(beats[0]);

  // A resync for the moments the observer has nothing new to say: after a
  // deep link, once fonts have settled the layout, and when a jump ends.
  const bandY = () => innerHeight * (phone.matches ? 0.72 : 0.5);
  function pick() {
    const y = bandY();
    let best = beats[0];
    for (const b of beats) {
      const r = b.getBoundingClientRect();
      if (r.top <= y) best = b;
      if (r.top <= y && r.bottom >= y) break;
    }
    activate(best);
  }
  const firstIn = (t: HTMLElement) => (t.matches("[data-step]") ? t : t.querySelector<HTMLElement>("[data-step]"));
  function toHash(behavior: ScrollBehavior) {
    const t = location.hash.startsWith("#l-") ? document.getElementById(location.hash.slice(1)) : null;
    if (!t) return;
    t.scrollIntoView({ behavior, block: "start" });
    const first = firstIn(t);
    if (first) activate(first);
  }
  toHash("auto");
  void document.fonts?.ready.then(() => {
    toHash("auto");
    if (!location.hash) pick();
  });
  addEventListener("hashchange", () => toHash("auto"));
  addEventListener("scrollend", pick);

  // Reduced motion: a still of the stage inside every beat.
  function stills() {
    lw.classList.toggle("lw-rm", reduce.matches);
    if (!reduce.matches || lw.querySelector(".lw-still")) return;
    for (const b of beats) {
      if (!b.classList.contains("lw-beat")) continue;
      const copy = (stage as HTMLElement).cloneNode(true) as HTMLElement;
      copy.classList.add("lw-still");
      copy.removeAttribute("data-stage");
      for (const img of copy.querySelectorAll("img")) img.loading = "lazy";
      paint(copy, b, true);
      b.append(copy);
    }
  }
  stills();
  reduce.addEventListener("change", stills);

  // Rail and "start again": jump, then hand focus to the chapter.
  for (const a of lw.querySelectorAll<HTMLAnchorElement>('a[href^="#l-"]')) {
    a.addEventListener("click", (e) => {
      const target = document.getElementById(a.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", a.hash);
      const first = firstIn(target);
      if (first) activate(first);
      if (target.hasAttribute("tabindex")) target.focus({ preventScroll: true });
    });
  }
}
