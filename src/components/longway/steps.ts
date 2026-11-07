// The long way round, as an ordered list of steps. Like the Tuesday story,
// each step is a COMPLETE stage state (never a change from the step before),
// so a jump, a fast scroll or a deep link lands on the right picture.
//
// The stage is a map of WHERE your code runs. A hard frame is your laptop:
// everything inside it is local, everything outside it is somebody else's
// computer. `d` puts the editor and each service in a place (native on the
// laptop, in the VM, in a container, in a pod, in a shared cluster, on a dev
// box, in the cloud, behind a ticket), and each chip wears that place as a
// tag. `chain` names the walls between you and your running code, nearest
// first; `sign` says where the code is in words; the receipt prints what each
// stop added to the bill.

export type Light = "warm" | "pale" | "steel" | "cold" | "frost" | "ice" | "dusk" | "home" | "night";
export type State = "on" | "sleep" | "pause" | "down";

/** Where a thing can run. `x` is its column on the map, in % of the map's
 *  width; `out` is true for anywhere that isn't your laptop. The VM, its
 *  containers and its cluster share one column, inside the laptop's frame. */
export const places = {
  laptop: { tag: "laptop", x: 15, out: false },
  vm: { tag: "VM", x: 41.5, out: false },
  ctr: { tag: "container", x: 41.5, out: false },
  pod: { tag: "cluster", x: 41.5, out: false },
  shared: { tag: "shared cluster", x: 79, out: true },
  box: { tag: "dev box", x: 69, out: true },
  cloud: { tag: "cloud", x: 88, out: true },
  ticket: { tag: "ticket", x: 88, out: true },
} as const;
export type Place = keyof typeof places;

/** The things on the map, in row order: the editor, then the stack. Before
 *  doze it's "your app" in generic names; at home it's Larder, the made-up
 *  example the whole site uses (doze-examples/larder), with its real names. */
export const things = [
  { id: "ed", name: "editor", home: "editor" },
  { id: "web", name: "web", home: "storefront" },
  { id: "api", name: "api", home: "gateway" },
  { id: "worker", name: "worker", home: "catalog" },
  { id: "db", name: "db", home: "postgres" },
  { id: "queue", name: "queue", home: "valkey" },
] as const;

export interface Step {
  id: string;
  ch: string; // rail chapter
  no: string; // the stop, on the sign: 01, 04a, now, home
  sign: string; // where your code runs, in words
  light: Light;
  fan: 0 | 1 | 2 | 3;
  d: [Place, Place, Place, Place, Place, Place]; // where each thing runs
  s?: [State, State, State, State, State]; // state of each service (default all on)
  chain: string[]; // the walls, nearest first; hops = chain.length
  wait: string; // who or what you wait on
  bill: 0 | 1 | 2 | 3 | 4 | 5; // the receipt's total: $0, $, $$, $$$, $$$$, and climbing
  torn?: true; // the receipt, torn off
  person?: "on" | "paged";
  lid?: "closed";
  laptop?: "hi";
  wide?: true; // the laptop's frame is the whole map again
}

/** The receipt: one line per cost, printed at the step named. Units, never
 *  prices: no invented numbers. A step shows every line printed up to it. */
export const receipt = [
  { at: "r1a", item: "your laptop", per: "already paid for" },
  { at: "r1b", item: "new hire vs. the README", per: "an afternoon" },
  { at: "vm-a", item: "a VM per project", per: "RAM, reserved" },
  { at: "c-b", item: "Linux VM, always on", per: "RAM, all day" },
  { at: "c-c", item: "debugging through a wall", per: "your patience" },
  { at: "k-a", item: "ten templates for hello world", per: "a learning curve" },
  { at: "k-out", item: "shared cluster", per: "per namespace" },
  { at: "k-b", item: "a port-forward per service", per: "a tab each" },
  { at: "cl-a", item: "dev box × every developer", per: "by the hour" },
  { at: "cl-b", item: "preview env × every pull request", per: "by the hour" },
  { at: "cl-b", item: "staging, shared", per: "broken by Thursday" },
  { at: "pl-a", item: "platform team", per: "salaries" },
  { at: "pl-b", item: "cost review: dev environments", per: "a meeting" },
  { at: "pl-b", item: "new hire: week one", per: "access requests" },
  { at: "pl-c", item: "on-call for dev environments", per: "a pager" },
  { at: "pl-c", item: "your whole team, waiting", per: "no ETA" },
] as const;
export const totals = ["$0", "$", "$$", "$$$", "$$$$", "$$$$ and climbing"];

const L: Step["d"] = ["laptop", "laptop", "laptop", "laptop", "laptop", "laptop"];
const vm: Step["d"] = ["laptop", "vm", "vm", "vm", "vm", "vm"];
const box = ["a VM", "a container"];
const cluster = ["a VPN", "a port-forward", "a cluster", "a pod"];
const cloud = ["a browser tab", "the internet", "a dev box", "a cluster", "a pod"];
const platform = [...cloud, "a ticket"];
const down: Step["s"] = ["down", "down", "down", "down", "down"];
const inCloud: Step["d"] = ["box", "cloud", "cloud", "cloud", "cloud", "cloud"];
const ticketed: Step["d"] = ["box", "cloud", "cloud", "cloud", "ticket", "cloud"];
const here = "On your laptop.";
const home = "On your laptop. Again.";
const away = "On somebody else's computer.";
const behind = "On somebody else's computer, behind a ticket.";

export const steps: Step[] = [
  { id: "cold", ch: "readme", no: "01", sign: here, light: "warm", fan: 1, d: L, chain: [], wait: "nobody", bill: 0 },
  { id: "r1a", ch: "readme", no: "01", sign: here, light: "warm", fan: 1, d: L, chain: [], wait: "nobody", bill: 0 },
  {
    id: "r1b",
    ch: "readme",
    no: "01",
    sign: "On your laptop. Just not the new hire's.",
    light: "warm",
    fan: 1,
    d: L,
    chain: [],
    wait: "whoever wrote the README",
    bill: 0,
  },
  {
    id: "vm-a",
    ch: "vm",
    no: "02",
    sign: "In a VM. Still on your laptop.",
    light: "pale",
    fan: 2,
    d: vm,
    chain: ["a VM"],
    wait: "the VM to boot",
    bill: 1,
  },
  {
    id: "vm-b",
    ch: "vm",
    no: "02",
    sign: "In a VM. Still on your laptop.",
    light: "pale",
    fan: 3,
    d: vm,
    chain: ["a VM"],
    wait: "the shared folder",
    bill: 1,
  },
  {
    id: "c-a",
    ch: "compose",
    no: "03",
    sign: "In containers, in a VM. Still on your laptop.",
    light: "steel",
    fan: 2,
    d: ["laptop", "ctr", "ctr", "ctr", "ctr", "ctr"],
    chain: box,
    wait: "nobody, mostly",
    bill: 1,
  },
  {
    id: "c-b",
    ch: "compose",
    no: "03",
    sign: "Split: web runs on your laptop again; everything else in containers, in a VM.",
    light: "steel",
    fan: 3,
    d: ["laptop", "laptop", "ctr", "ctr", "ctr", "ctr"],
    chain: box,
    wait: "the file mount",
    bill: 1,
  },
  {
    id: "c-c",
    ch: "compose",
    no: "03",
    sign: "Split: web runs on your laptop again; everything else in containers, in a VM.",
    light: "steel",
    fan: 3,
    d: ["laptop", "laptop", "ctr", "ctr", "ctr", "ctr"],
    s: ["on", "pause", "on", "on", "on"],
    chain: box,
    wait: "the debugger",
    bill: 1,
  },
  {
    id: "k-a",
    ch: "cluster",
    no: "04a",
    sign: "In a cluster, in a VM, on your laptop.",
    light: "cold",
    fan: 3,
    d: ["laptop", "pod", "pod", "pod", "pod", "pod"],
    chain: ["a VM", "a cluster", "a pod"],
    wait: "pods to start",
    bill: 2,
  },
  {
    id: "k-out",
    ch: "cluster",
    no: "04b",
    sign: "In a shared cluster. Not on your laptop any more.",
    light: "cold",
    fan: 1,
    d: ["laptop", "shared", "shared", "shared", "shared", "shared"],
    chain: cluster,
    wait: "the VPN",
    bill: 2,
  },
  {
    id: "k-b",
    ch: "cluster",
    no: "04b",
    sign: "Split: your editor and web here; the rest in a shared cluster, over a port-forward.",
    light: "cold",
    fan: 1,
    d: ["laptop", "laptop", "shared", "shared", "shared", "shared"],
    chain: cluster,
    wait: "the sync",
    bill: 2,
  },
  {
    id: "k-c",
    ch: "cluster",
    no: "04b",
    sign: "Split: your editor and web here; the rest in a shared cluster, over a port-forward.",
    light: "cold",
    fan: 1,
    d: ["laptop", "laptop", "shared", "shared", "shared", "shared"],
    s: ["on", "pause", "on", "on", "on"],
    chain: cluster,
    wait: "the tunnel",
    bill: 2,
  },
  {
    id: "cl-a",
    ch: "cloud",
    no: "05",
    sign: away,
    light: "frost",
    fan: 1,
    d: inCloud,
    chain: cloud,
    wait: "the network",
    bill: 3,
  },
  {
    id: "cl-b",
    ch: "cloud",
    no: "05",
    sign: away,
    light: "frost",
    fan: 1,
    d: inCloud,
    chain: cloud,
    wait: "staging",
    bill: 3,
  },
  {
    id: "pl-a",
    ch: "platform",
    no: "06",
    sign: behind,
    light: "ice",
    fan: 1,
    d: ticketed,
    chain: platform,
    wait: "a ticket",
    bill: 4,
    person: "on",
  },
  {
    id: "pl-b",
    ch: "platform",
    no: "06",
    sign: behind,
    light: "ice",
    fan: 1,
    d: ticketed,
    chain: platform,
    wait: "a quota",
    bill: 4,
    person: "on",
  },
  {
    id: "pl-c",
    ch: "platform",
    no: "06",
    sign: "On somebody else's computer. Degraded, no ETA.",
    light: "ice",
    fan: 1,
    d: ticketed,
    s: down,
    chain: platform,
    wait: "an ETA",
    bill: 5,
    person: "paged",
  },
  {
    id: "t-a",
    ch: "desk",
    no: "now",
    sign: "Your code: somebody else's computer. Your laptop: mostly idle.",
    light: "dusk",
    fan: 1,
    d: ticketed,
    s: down,
    chain: platform,
    wait: "an ETA",
    bill: 5,
    person: "paged",
    laptop: "hi",
  },
  {
    id: "t-b",
    ch: "desk",
    no: "now",
    sign: "Your code: somebody else's computer. Your laptop: mostly idle.",
    light: "dusk",
    fan: 1,
    d: ticketed,
    s: down,
    chain: platform,
    wait: "an ETA",
    bill: 5,
    person: "paged",
    laptop: "hi",
  },
  {
    id: "h-a",
    ch: "home",
    no: "home",
    sign: home,
    light: "home",
    fan: 0,
    d: L,
    chain: [],
    wait: "nobody",
    bill: 0,
    torn: true,
    wide: true,
  },
  {
    id: "h-b",
    ch: "home",
    no: "home",
    sign: home,
    light: "home",
    fan: 0,
    d: L,
    s: ["sleep", "sleep", "on", "on", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
    torn: true,
    wide: true,
  },
  {
    id: "h-c",
    ch: "home",
    no: "home",
    sign: home,
    light: "home",
    fan: 0,
    d: L,
    s: ["sleep", "sleep", "pause", "on", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
    torn: true,
    wide: true,
  },
  {
    id: "h-d",
    ch: "home",
    no: "home",
    sign: home,
    light: "home",
    fan: 0,
    d: L,
    s: ["sleep", "down", "sleep", "on", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
    torn: true,
    wide: true,
  },
  {
    id: "h-e",
    ch: "home",
    no: "home",
    sign: "On your laptop. Asleep.",
    light: "night",
    fan: 0,
    d: L,
    s: ["sleep", "sleep", "sleep", "sleep", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
    torn: true,
    wide: true,
    lid: "closed",
  },
];

export const step = (id: string): Step => {
  const s = steps.find((x) => x.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return s;
};

const ix = (id: string) => {
  const i = steps.findIndex((x) => x.id === id);
  if (i < 0) throw new Error(`no step ${id}`);
  return i;
};

/** How many receipt lines have printed by a step (all of them, once torn). */
const printed = (id: string) => receipt.filter((r) => ix(r.at) <= ix(id)).length;

/** The steps an element shows in: "id" alone, or [from, to] inclusive. */
export function on(...parts: (string | [string, string])[]): string {
  const out: string[] = [];
  for (const p of parts) {
    const [a, b] = typeof p === "string" ? [p, p] : p;
    for (let i = ix(a); i <= ix(b); i++) out.push(steps[i].id);
  }
  return out.join(" ");
}

/** A beat's facts, as the attributes the script paints the stage from. */
export function beat(id: string, anchor = true) {
  const s = step(id);
  return {
    ...(anchor ? { id: `l-${id}` } : {}),
    "data-step": id,
    "data-ch": s.ch,
    "data-no": s.no,
    "data-sign": s.sign,
    "data-light": s.light,
    "data-fan": String(s.fan),
    "data-d": s.d.join(","),
    "data-s": (s.s ?? ["on", "on", "on", "on", "on"]).join(","),
    "data-chain": s.chain.join("|"),
    "data-wait": s.wait,
    "data-bill": String(s.bill),
    "data-till": String(printed(id)),
    "data-torn": s.torn ? "1" : "",
    "data-person": s.person ?? "",
    "data-lid": s.lid ?? "open",
    "data-laptop": s.laptop ?? "",
    "data-wide": s.wide ? "1" : "",
  };
}

/** The rail: one stop per era, in story order. */
export const chapters = [
  { id: "readme", short: "01", label: "README", name: "Stop one: services and a README" },
  { id: "vm", short: "02", label: "VM", name: "Stop two: a VM per project" },
  { id: "compose", short: "03", label: "compose", name: "Stop three: one compose file" },
  { id: "cluster", short: "04", label: "cluster", name: "Stop four: Kubernetes for dev" },
  { id: "cloud", short: "05", label: "cloud", name: "Stop five: cloud dev environments" },
  { id: "platform", short: "06", label: "platform", name: "Stop six: the platform team" },
  { id: "desk", short: "now", label: "your desk", name: "Meanwhile, on your desk" },
  { id: "home", short: "home", label: "home", name: "The way home" },
];
