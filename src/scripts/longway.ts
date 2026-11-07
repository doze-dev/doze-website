import { type Place, places } from "../components/longway/steps";

// The long way round. An IntersectionObserver picks the beat in the reading
// band; that beat's data-* attributes are a COMPLETE stage state (where each
// thing runs, the walls in between, the fan, the wait, the receipt), so jumps,
// fast scrolls and deep links land on the right picture. Reduced motion: no
// pinning; each beat gets a still copy of the stage. Same mechanics as
// scripts/tuesday.ts, and the same opt-in Sound button.

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
  const totals = ["$0", "$", "$$", "$$$", "$$$$", "$$$$ and climbing"];
  const ids = ["ed", "web", "api", "worker", "db", "queue"];
  const vmWords: Partial<Record<Place, string>> = { vm: "a VM", ctr: "a VM · containers", pod: "a VM · a cluster" };
  const words: Record<string, string> = {
    on: "awake",
    sleep: "asleep| · wakes when called",
    pause: "paused| on your breakpoint",
    down: "crashing| on start",
  };
  const till = tillSound();
  let current: HTMLElement | null = null;

  // Where a thing sits on the map, in % of the map: the same sums as the
  // CSS (.lw-chip --x/--y), from the same variables, so the tethers meet the chips.
  function at(p: Place, i: number): [number, number] {
    const cs = getComputedStyle(lw);
    const v = (n: string) => Number(cs.getPropertyValue(n)) || 0;
    return [places[p]?.x ?? 15, v("--r0") + i * v("--rs")];
  }

  // Paint one stage from one beat: everything, never a delta. Returns
  // whether the receipt printed a new line (for the till's ka-ching).
  function paint(st: HTMLElement, beat: HTMLElement, still = false): "print" | "tear" | "" {
    const d = beat.dataset;
    const id = d.step ?? "";
    const was = st.dataset.d;
    const wasOut = (st.dataset.out ?? "").split(",");
    st.dataset.step = id;
    st.dataset.ch = d.ch ?? "";
    st.dataset.fan = d.fan ?? "0";
    st.dataset.lid = d.lid ?? "open";
    st.dataset.light = d.light ?? "";
    st.dataset.person = d.person ?? "";
    st.dataset.laptop = d.laptop ?? "";
    st.dataset.wide = d.wide ?? "";
    st.dataset.d = d.d ?? "";
    for (const el of st.querySelectorAll<HTMLElement>("[data-in]")) {
      el.classList.toggle("on", (el.dataset.in ?? "").split(" ").includes(id));
    }

    // the sign: where your code runs, in words
    const no = st.querySelector("[data-no]");
    if (no) no.textContent = d.no ?? "";
    const sign = st.querySelector<HTMLElement>("[data-sign]");
    if (sign && sign.dataset.text !== d.sign) {
      sign.dataset.text = d.sign ?? "";
      const [lead, rest] = (d.sign ?? "").match(/^(Split:|Your code:)(.*)$/s)?.slice(1) ?? ["", d.sign ?? ""];
      sign.replaceChildren();
      if (lead) {
        const em = document.createElement("em");
        em.textContent = lead;
        sign.append(em);
      }
      sign.append(rest);
      if (!still) {
        sign.classList.remove("flip");
        void sign.offsetWidth;
        sign.classList.add("flip");
      }
    }

    // where everything runs, and in what state
    const at0 = (d.d ?? "").split(",") as Place[];
    const states = ["on", ...(d.s ?? "").split(",")];
    const out: string[] = [];
    ids.forEach((t, i) => {
      const chip = st.querySelector<HTMLElement>(`[data-t="${t}"]`);
      if (!chip) return;
      const p = at0[i] ?? "laptop";
      const far = places[p]?.out ?? false;
      out.push(far ? "1" : "");
      chip.style.setProperty("--x", String(places[p]?.x ?? 15));
      chip.dataset.at = p;
      chip.dataset.out = far ? "1" : "";
      chip.dataset.s = states[i] || "on";
      const tag = chip.querySelector("[data-tag]");
      if (tag) tag.textContent = places[p]?.tag ?? "";
      // crossing the laptop's edge, on the way out: a pulse, once
      chip.classList.toggle("lw-cross", !still && far && was !== undefined && wasOut[i] === "");
      const word = st.querySelector<HTMLElement>(`[data-addr="${t}"] [data-word]`);
      if (word) {
        const [w, more = ""] = (i === 0 ? "same machine| as everything else" : (words[chip.dataset.s] ?? "")).split(
          "|",
        );
        word.textContent = w;
        word.dataset.more = more;
      }
    });
    st.dataset.out = out.join(",");
    const anyOut = out.some(Boolean);
    st.classList.toggle("lw-gone", anyOut);
    st.classList.toggle("lw-crossing", !still && anyOut && was !== undefined && !wasOut.some(Boolean));

    // the boxes: the VM inside the laptop, and the places outside it
    const vmKind = at0.find((p) => p in vmWords);
    for (const box of st.querySelectorAll<HTMLElement>("[data-box]")) {
      const k = box.dataset.box as string;
      const shown =
        k === "vm"
          ? !!vmKind
          : k === "cloud"
            ? at0.some((p) => p === "cloud" || p === "ticket")
            : at0.includes(k as Place);
      box.classList.toggle("on", shown);
    }
    const vl = st.querySelector("[data-vm-label]");
    if (vl && vmKind) vl.textContent = vmWords[vmKind] ?? "a VM";

    // the walls, and the meter that counts them
    const chain = d.chain ? d.chain.split("|") : [];
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
    const ed = at(at0[0] ?? "laptop", 0);
    const you = at("laptop", 0);
    for (const line of st.querySelectorAll<SVGLineElement>("[data-line]")) {
      const t = line.dataset.line ?? "";
      const i = ids.indexOf(t);
      const p = at0[i] ?? "laptop";
      const [a, b] = t === "you" ? [you, ed] : [ed, at(p, i)];
      const len = Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
      line.setAttribute("x1", String(a[0]));
      line.setAttribute("y1", String(a[1]));
      line.setAttribute("x2", String(b[0]));
      line.setAttribute("y2", String(b[1]));
      line.classList.toggle("on", t === "you" ? at0[0] !== "laptop" : len > 0 && p !== at0[0]);
      line.classList.toggle("tunnel", t === "you" ? (places[at0[0]]?.out ?? false) : (places[p]?.out ?? false));
    }
    // lines jump, chips glide: hide the lines while the chips are moving
    if (!still && was !== undefined && was !== st.dataset.d) {
      st.classList.add("lw-moving");
      clearTimeout(Number(st.dataset.mt ?? 0));
      st.dataset.mt = String(setTimeout(() => st.classList.remove("lw-moving", "lw-crossing"), 900));
    }

    // the strip
    const fw = st.querySelector("[data-fan-word]");
    if (fw) fw.textContent = fanWords[Number(d.fan ?? 0)] ?? "off";
    const wt = st.querySelector("[data-wait]");
    if (wt) wt.textContent = d.wait ?? "nobody";

    // the receipt: every line printed so far, the total, or torn off
    const n = Number(d.till ?? 0);
    const prevN = Number(st.dataset.till ?? -1);
    const torn = d.torn === "1";
    const wasTorn = st.dataset.torn === "1";
    st.dataset.till = String(n);
    st.dataset.torn = torn ? "1" : "";
    st.dataset.bill = d.bill ?? "0";
    for (const li of st.querySelectorAll<HTMLElement>("[data-n]")) {
      const k = Number(li.dataset.n);
      li.classList.toggle("on", k < n);
      li.classList.toggle("new", !still && !torn && k < n && k >= prevN && prevN >= 0);
    }
    const tot = st.querySelector("[data-total]");
    if (tot) tot.textContent = totals[Number(d.bill ?? 0)] ?? "$0";
    const tillEl = st.querySelector<HTMLElement>("[data-till]");
    if (tillEl && !still) {
      tillEl.classList.remove("feed", "tear");
      void tillEl.offsetWidth;
      if (torn && !wasTorn && prevN >= 0) tillEl.classList.add("tear");
      else if (!torn && n > prevN && prevN >= 0) tillEl.classList.add("feed");
    }
    if (still || prevN < 0) return "";
    if (torn && !wasTorn) return "tear";
    if (!torn && n > prevN) return "print";
    return "";
  }

  function activate(beat: HTMLElement) {
    if (beat === current) return;
    current = beat;
    till.play(paint(stage as HTMLElement, beat));
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

  // The till, out loud, only once asked.
  const btn = lw.querySelector<HTMLButtonElement>("[data-sound]");
  btn?.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    till.enable(on);
  });

  // The stage is decorative; its sign is the one thing the beats don't say
  // word for word, so each beat carries it for screen readers.
  for (const b of beats) {
    if (!b.dataset.sign || !b.classList.contains("lw-beat")) continue;
    const p = document.createElement("div");
    p.className = "sr-only";
    p.textContent = `Where your code runs: ${b.dataset.sign}`;
    b.prepend(p);
  }
}

// The till, out loud: off until asked. A printer's chatter and a bell for
// each new line; a short rip when the receipt is torn off. Never autoplays:
// the AudioContext is made on the Sound button's click.
function tillSound() {
  let ctx: AudioContext | null = null;
  let enabled = false;
  function noise(len: number) {
    const c = ctx as AudioContext;
    const buf = c.createBuffer(1, Math.floor(c.sampleRate * len), c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    src.buffer = buf;
    return src;
  }
  function burst(at: number, len: number, freq: number, vol: number, type: BiquadFilterType = "bandpass") {
    const c = ctx as AudioContext;
    const src = noise(len);
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, at);
    g.gain.exponentialRampToValueAtTime(0.001, at + len);
    src.connect(f).connect(g).connect(c.destination);
    src.start(at);
  }
  function bell(at: number, freq: number, vol: number) {
    const c = ctx as AudioContext;
    for (const [mult, v] of [
      [1, 1],
      [2.76, 0.35],
    ]) {
      const o = c.createOscillator();
      o.frequency.value = freq * mult;
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, at);
      g.gain.exponentialRampToValueAtTime(vol * v, at + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.9);
      o.connect(g).connect(c.destination);
      o.start(at);
      o.stop(at + 1);
    }
  }
  return {
    enable(on: boolean) {
      enabled = on;
      if (on && !ctx) ctx = new AudioContext();
      if (on) void ctx?.resume();
    },
    play(what: "print" | "tear" | "") {
      if (!enabled || !ctx || !what) return;
      const t = ctx.currentTime + 0.02;
      if (what === "tear") {
        burst(t, 0.28, 3000, 0.18, "highpass");
        return;
      }
      for (let k = 0; k < 4; k++) burst(t + k * 0.045, 0.03, 1800, 0.12);
      burst(t + 0.2, 0.08, 220, 0.25, "lowpass");
      bell(t + 0.24, 2093, 0.12);
      bell(t + 0.32, 2637, 0.1);
    },
  };
}
