export {};

// The Tuesday scroll story. An IntersectionObserver picks the beat in the
// middle of the screen; that beat's data-* attributes are a COMPLETE stage
// state, so jumps, fast scrolls and deep links land on the right picture.
// Reduced motion: no pinning; each beat gets a still copy of the stage.

const root = document.querySelector<HTMLElement>("[data-tn]");
if (root) init(root);

function init(tn: HTMLElement) {
  tn.classList.add("tn-js");
  const stage = tn.querySelector<HTMLElement>("[data-stage]");
  if (!stage) return;
  const beats = [...tn.querySelectorAll<HTMLElement>("[data-step]")].filter((el) => !el.closest("[data-stage]"));
  const rail = [...tn.querySelectorAll<HTMLAnchorElement>("[data-rail]")];
  const order = rail.map((a) => a.dataset.rail);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const phone = matchMedia("(max-width: 900px)");
  const fanWords = ["off", "whirring", "loud", "roaring"];
  let current: HTMLElement | null = null;
  const sound = fanSound();

  // Paint one stage from one beat: everything, never a delta.
  function paint(st: HTMLElement, beat: HTMLElement) {
    const d = beat.dataset;
    const id = d.step ?? "";
    st.dataset.step = id;
    st.dataset.fan = d.fan ?? "0";
    st.dataset.lid = d.lid ?? "open";
    st.dataset.light = d.light ?? "";
    st.style.setProperty("--heat", d.heat ?? "0");
    for (const el of st.querySelectorAll<HTMLElement>("[data-in]")) {
      el.classList.toggle("on", (el.dataset.in ?? "").split(" ").includes(id));
    }
    for (const el of st.querySelectorAll<HTMLElement>("[data-hi]")) {
      el.classList.toggle("hi", (el.dataset.hi ?? "").split(" ").includes(id));
    }
    const clock = d.clock ?? "8:57";
    for (const el of st.querySelectorAll<HTMLElement>("[data-clock]")) el.textContent = clock;
    const [h, m] = clock.split(":").map(Number);
    const mins = h * 60 + m;
    st.style.setProperty("--ha", `${mins * 0.5}deg`);
    st.style.setProperty("--ma", `${mins * 6}deg`);
    const fw = st.querySelector("[data-fan-word]");
    if (fw) fw.textContent = fanWords[Number(d.fan ?? 0)] ?? "off";
    const hw = st.querySelector("[data-heat-word]");
    const heat = Number(d.heat ?? 0);
    if (hw) hw.textContent = heat < 0.25 ? "cool" : heat < 0.6 ? "warm" : "hot";
  }

  function activate(beat: HTMLElement) {
    if (beat === current) return;
    current = beat;
    paint(stage as HTMLElement, beat);
    tn.dataset.light = beat.dataset.light ?? "dawn";
    for (const b of beats) b.classList.toggle("on", b === beat);
    const ch = order.indexOf(beat.dataset.ch);
    rail.forEach((a, i) => {
      if (i === ch) a.setAttribute("aria-current", "step");
      else a.removeAttribute("aria-current");
      a.classList.toggle("past", i < ch);
    });
    sound.level(Number(beat.dataset.fan ?? 0));
  }

  // Which beat is in the reading band (middle on desktop, lower on phone).
  let io: IntersectionObserver | null = null;
  function observe() {
    io?.disconnect();
    const band = phone.matches ? "-68% 0px -26% 0px" : "-46% 0px -46% 0px";
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
  phone.addEventListener("change", observe);
  activate(beats[0]);

  // A resync for the moments the observer has nothing new to say: after a
  // deep link, once fonts have settled the layout, and when a jump ends.
  const bandY = () => innerHeight * (phone.matches ? 0.7 : 0.5);
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
  function toHash(behavior: ScrollBehavior) {
    const t = location.hash.startsWith("#t-") ? document.getElementById(location.hash.slice(1)) : null;
    if (!t) return;
    t.scrollIntoView({ behavior, block: "start" });
    const first = t.matches("[data-step]") ? t : t.querySelector<HTMLElement>("[data-step]");
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
    tn.classList.toggle("tn-rm", reduce.matches);
    if (!reduce.matches || tn.querySelector(".tn-still")) return;
    for (const b of beats) {
      if (!b.classList.contains("tn-beat")) continue;
      const copy = (stage as HTMLElement).cloneNode(true) as HTMLElement;
      copy.classList.add("tn-still");
      copy.removeAttribute("data-stage");
      paint(copy, b);
      b.append(copy);
    }
  }
  stills();
  reduce.addEventListener("change", stills);

  // Rail and "start again": jump, then hand focus to the chapter.
  for (const a of tn.querySelectorAll<HTMLAnchorElement>('a[href^="#t-"]')) {
    a.addEventListener("click", (e) => {
      const target = document.getElementById(a.hash.slice(1));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: reduce.matches ? "auto" : "smooth", block: "start" });
      history.replaceState(null, "", a.hash);
      const first = target.matches("[data-step]") ? target : target.querySelector<HTMLElement>("[data-step]");
      if (first) activate(first);
      if (target.tabIndex < 0 || target.hasAttribute("tabindex")) target.focus({ preventScroll: true });
    });
  }

  // The fan, out loud: off until asked; brown noise through a filter, louder
  // as the day goes; silent in the doze replay.
  const btn = tn.querySelector<HTMLButtonElement>("[data-sound]");
  btn?.addEventListener("click", () => {
    const on = btn.getAttribute("aria-pressed") !== "true";
    btn.setAttribute("aria-pressed", String(on));
    sound.enable(on, Number(current?.dataset.fan ?? 0));
  });
}

function fanSound() {
  let ctx: AudioContext | null = null;
  let gain: GainNode | null = null;
  let filter: BiquadFilterNode | null = null;
  let enabled = false;
  let lvl = 0;
  const vol = [0, 0.05, 0.09, 0.14];
  const freq = [200, 380, 650, 1000];
  function set() {
    if (!ctx || !gain || !filter) return;
    const t = ctx.currentTime;
    gain.gain.setTargetAtTime(enabled ? vol[lvl] : 0, t, 0.6);
    filter.frequency.setTargetAtTime(freq[lvl], t, 0.6);
  }
  function build() {
    ctx = new AudioContext();
    const len = ctx.sampleRate * 3;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02;
      data[i] = last * 3.5;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
  }
  return {
    enable(on: boolean, level: number) {
      enabled = on;
      lvl = level;
      if (on && !ctx) build();
      if (on) void ctx?.resume();
      set();
    },
    level(level: number) {
      lvl = level;
      set();
    },
  };
}
