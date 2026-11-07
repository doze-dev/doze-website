// The long way round, as an ordered list of steps. Like the Tuesday story,
// each step is a COMPLETE stage state (never a change from the step before),
// so a jump, a fast scroll or a deep link lands on the right picture.
//
// The stage is a map of distance: band 0 is your laptop, and every band to
// the right is one more wall between you and your running code. `d` puts the
// editor and each service in a band; `chain` names the walls, in order.

export type Light = "warm" | "pale" | "steel" | "cold" | "frost" | "ice" | "dusk" | "home" | "night";
export type State = "on" | "sleep" | "pause" | "down";

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
  light: Light;
  fan: 0 | 1 | 2 | 3;
  d: [number, number, number, number, number, number]; // band of each thing
  s?: [State, State, State, State, State]; // state of each service (default all on)
  chain: string[]; // the walls, nearest first; hops = chain.length
  wait: string; // who or what you wait on
  bill: 0 | 1 | 2 | 3;
  person?: "on" | "paged";
  lid?: "closed";
  laptop?: "hi";
}

const local: Step["d"] = [0, 0, 0, 0, 0, 0];
const vm: Step["d"] = [0, 1, 1, 1, 1, 1];
const box = ["a VM", "a container"];
const cluster = ["a VPN", "a port-forward", "a cluster", "a pod"];
const cloud = ["a browser tab", "the internet", "a dev box", "a cluster", "a pod"];
const platform = [...cloud, "a ticket"];
const down: Step["s"] = ["down", "down", "down", "down", "down"];

export const steps: Step[] = [
  { id: "cold", ch: "readme", light: "warm", fan: 1, d: local, chain: [], wait: "nobody", bill: 0 },
  { id: "r1a", ch: "readme", light: "warm", fan: 1, d: local, chain: [], wait: "nobody", bill: 0 },
  { id: "r1b", ch: "readme", light: "warm", fan: 1, d: local, chain: [], wait: "whoever wrote the README", bill: 0 },
  { id: "vm-a", ch: "vm", light: "pale", fan: 2, d: vm, chain: ["a VM"], wait: "the VM to boot", bill: 0 },
  { id: "vm-b", ch: "vm", light: "pale", fan: 3, d: vm, chain: ["a VM"], wait: "the shared folder", bill: 0 },
  {
    id: "c-a",
    ch: "compose",
    light: "steel",
    fan: 2,
    d: [0, 2, 2, 2, 2, 2],
    chain: box,
    wait: "nobody, mostly",
    bill: 0,
  },
  {
    id: "c-b",
    ch: "compose",
    light: "steel",
    fan: 3,
    d: [0, 0, 2, 2, 2, 2],
    chain: box,
    wait: "the file mount",
    bill: 0,
  },
  {
    id: "c-c",
    ch: "compose",
    light: "steel",
    fan: 3,
    d: [0, 0, 2, 2, 2, 2],
    s: ["on", "pause", "on", "on", "on"],
    chain: box,
    wait: "the debugger",
    bill: 0,
  },
  {
    id: "k-a",
    ch: "cluster",
    light: "cold",
    fan: 3,
    d: [0, 3, 3, 3, 3, 3],
    chain: ["a VM", "a cluster", "a pod"],
    wait: "pods to start",
    bill: 0,
  },
  { id: "k-b", ch: "cluster", light: "cold", fan: 1, d: [0, 4, 4, 4, 4, 4], chain: cluster, wait: "the sync", bill: 1 },
  {
    id: "k-c",
    ch: "cluster",
    light: "cold",
    fan: 1,
    d: [0, 4, 4, 4, 4, 4],
    s: ["on", "pause", "on", "on", "on"],
    chain: cluster,
    wait: "the tunnel",
    bill: 1,
  },
  {
    id: "cl-a",
    ch: "cloud",
    light: "frost",
    fan: 1,
    d: [3, 5, 5, 5, 5, 5],
    chain: cloud,
    wait: "the network",
    bill: 1,
  },
  { id: "cl-b", ch: "cloud", light: "frost", fan: 1, d: [3, 5, 5, 5, 5, 5], chain: cloud, wait: "staging", bill: 2 },
  {
    id: "pl-a",
    ch: "platform",
    light: "ice",
    fan: 1,
    d: [3, 5, 5, 5, 6, 5],
    chain: platform,
    wait: "a ticket",
    bill: 2,
    person: "on",
  },
  {
    id: "pl-b",
    ch: "platform",
    light: "ice",
    fan: 1,
    d: [3, 5, 5, 5, 6, 5],
    chain: platform,
    wait: "a quota",
    bill: 3,
    person: "on",
  },
  {
    id: "pl-c",
    ch: "platform",
    light: "ice",
    fan: 1,
    d: [3, 5, 5, 5, 6, 5],
    s: down,
    chain: platform,
    wait: "an ETA",
    bill: 3,
    person: "paged",
  },
  {
    id: "t-a",
    ch: "desk",
    light: "dusk",
    fan: 1,
    d: [3, 5, 5, 5, 6, 5],
    s: down,
    chain: platform,
    wait: "an ETA",
    bill: 3,
    person: "paged",
    laptop: "hi",
  },
  {
    id: "t-b",
    ch: "desk",
    light: "dusk",
    fan: 1,
    d: [3, 5, 5, 5, 6, 5],
    s: down,
    chain: platform,
    wait: "an ETA",
    bill: 3,
    person: "paged",
    laptop: "hi",
  },
  { id: "h-a", ch: "home", light: "home", fan: 0, d: local, chain: [], wait: "nobody", bill: 0 },
  {
    id: "h-b",
    ch: "home",
    light: "home",
    fan: 0,
    d: local,
    s: ["sleep", "sleep", "on", "on", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
  },
  {
    id: "h-c",
    ch: "home",
    light: "home",
    fan: 0,
    d: local,
    s: ["sleep", "sleep", "pause", "on", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
  },
  {
    id: "h-d",
    ch: "home",
    light: "home",
    fan: 0,
    d: local,
    s: ["sleep", "down", "sleep", "on", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
  },
  {
    id: "h-e",
    ch: "home",
    light: "night",
    fan: 0,
    d: local,
    s: ["sleep", "sleep", "sleep", "sleep", "sleep"],
    chain: [],
    wait: "nobody",
    bill: 0,
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
    "data-light": s.light,
    "data-fan": String(s.fan),
    "data-d": s.d.join(","),
    "data-s": (s.s ?? ["on", "on", "on", "on", "on"]).join(","),
    "data-chain": s.chain.join("|"),
    "data-wait": s.wait,
    "data-bill": String(s.bill),
    "data-person": s.person ?? "",
    "data-lid": s.lid ?? "open",
    "data-laptop": s.laptop ?? "",
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
