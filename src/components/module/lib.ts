// What the module pages compute from the signed index (src/lib/registry.ts):
// doze.hcl blocks, doze.lock entries as doze writes them, engine groupings and
// the "which doze" history. Nothing here is copy; per-module copy lives in
// src/data/module-extras.ts.
import {
  display,
  look,
  type Module,
  modules,
  platformLabel,
  type Release,
  registry,
  semverGte,
} from "../../lib/registry";

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Page paths for a module. */
export const base = (m: Module) => `/registry/${m.namespace}/${m.name}/`;
export const relHref = (m: Module, v: string) => `${base(m)}${v}/`;

/** Every module page is built for every module in the index. */
export const modulePaths = () => modules.map((m) => ({ params: { ns: m.namespace, module: m.name } }));

/** Which doze-binaries engine a module runs (look.engine is its display name). */
export const engineKey: Record<string, string> = {
  postgres: "postgres",
  valkey: "valkey",
  kvrocks: "kvrocks",
  ferret: "ferretdb",
  mariadb: "mariadb",
  temporal: "temporal",
};
export const engineOf = (m: Module) => {
  const key = engineKey[m.name];
  return key ? registry.engines[key] : undefined;
};

/** Short platform marks, as the boards draw them. */
export const triShort: Record<string, string> = {
  "aarch64-apple-darwin": "mac",
  "aarch64-unknown-linux-gnu": "arm",
  "x86_64-unknown-linux-gnu": "x86",
};
export const triOrder = ["aarch64-apple-darwin", "aarch64-unknown-linux-gnu", "x86_64-unknown-linux-gnu"];
export const sortTriples = (ts: string[]) => [...ts].sort((a, b) => triOrder.indexOf(a) - triOrder.indexOf(b));
export const plat = (t: string) => platformLabel[t] ?? t;

/** The engine a release's `engines` list names: "Postgres", "Valkey", "Kafka protocol". */
export function engineName(m: Module, override?: string): string | null {
  return override ?? look[m.name]?.engine ?? null;
}

/** "14–18" for a run of majors, "8, 9" otherwise; "" for none. */
export function range(es: string[]): string {
  if (!es.length) return "";
  if (es.length === 1) return es[0];
  const n = es.map(Number);
  const run = n.every((x, i) => i === 0 || x === n[i - 1] + 1);
  return run && n.every((x) => Number.isInteger(x)) ? `${es[0]}–${es[es.length - 1]}` : es.join(", ");
}

/** "Postgres 14–18"; "runs itself" when a release names no engine. */
export function engineLabel(m: Module, r: Release, override?: string): string {
  const name = engineName(m, override);
  if (!r.engines.length || !name) return "runs itself";
  return `${name} ${range(r.engines)}`;
}

/** The value `version =` takes, as the module's own example writes it (describe.go). */
export function versionValue(m: Module): string | null {
  const hit = String(m.meta.example ?? "").match(/^\s*version\s*=\s*(.+?)\s*$/m);
  return hit ? hit[1] : null;
}

/** The smallest doze.hcl block for a module, in doze 0.2 syntax. */
export function startBlock(m: Module, opts: { port?: boolean; label?: string } = {}): string {
  const v = versionValue(m);
  const lines: [string, string][] = [];
  if (v) lines.push(["version", v]);
  if (opts.port && m.meta.port) lines.push(["port", String(m.meta.port)]);
  const head = `module ${m.name} "${opts.label ?? m.name}"`;
  if (!lines.length) return `${head} {}`;
  const w = Math.max(...lines.map(([k]) => k.length));
  return `${head} {\n${lines.map(([k, val]) => `  ${k.padEnd(w)} = ${val}`).join("\n")}\n}`;
}

/** The module's own example (meta.yaml), moved to doze 0.2's `module` syntax. */
export function exampleBlock(m: Module): string | null {
  const ex = String(m.meta.example ?? "");
  if (!ex) return null;
  return ex.replace(new RegExp(`^${m.name} "`), `module ${m.name} "`);
}

/** Light HCL colouring: keywords that open a block, strings, comments. Classes are the page's own. */
export function hcl(src: string, k: string, s: string, c?: string): string {
  return src
    .split("\n")
    .map((line) => {
      let out = esc(line);
      out = out.replace(/("(?:[^"\\]|\\.)*")/g, `<span class="${s}">$1</span>`);
      out = out.replace(/^(\s*)(module|app)\b/, `$1<span class="${k}">$2</span>`);
      if (c) out = out.replace(/(^|\s)(#.*)$/, `$1<span class="${c}">$2</span>`);
      return out;
    })
    .join("\n");
}

/** A short hash for narrow places: a07134…b89a. */
export const short = (h: string, head = 6, tail = 4) => `${h.slice(0, head)}…${h.slice(-tail)}`;

/** The doze.lock entry doze writes for a module release (internal/binaries/lock.go: ModulePin). */
export function lockEntry(m: Module, r: Release, opts: { hash?: (h: string) => string } = {}): string {
  const h = opts.hash ?? ((x: string) => x);
  const out = ["modules:", `    ${m.namespace}/${m.name}:`, `        version: ${r.version}`];
  if (r.protocol) out.push(`        protocol: ${r.protocol}`);
  if (r.engines.length) out.push("        engines:", ...r.engines.map((e) => `            - "${e}"`));
  const ps = [...r.platforms].sort((a, b) => a.triple.localeCompare(b.triple));
  if (ps.length) out.push("        hashes:", ...ps.map((p) => `            ${p.triple}: sha256:${h(p.sha256)}`));
  if (r.doze) out.push(`        doze: ${r.doze}`);
  return out.join("\n");
}
/** The same, coloured: quoted engine majors as strings. */
export const lockHtml = (text: string, s: string) => esc(text).replace(/("[^"]*")/g, `<span class="${s}">$1</span>`);

/** The release tag page on GitHub, from an artifact URL. */
export function tagPage(r: Release | undefined, m: Module): string {
  const url = r?.platforms[0]?.url ?? "";
  const hit = url.match(/^(https:\/\/github\.com\/[^/]+\/[^/]+)\/releases\/download\/([^/]+)\//);
  return hit ? `${hit[1]}/releases/tag/${hit[2]}` : `https://github.com/doze-dev/doze-modules/releases/tag/${m.name}`;
}
export function downloadDir(r: Release): string {
  const url = r.platforms[0]?.url ?? "";
  return url.slice(0, url.lastIndexOf("/") + 1);
}
export const fileName = (url: string) => url.slice(url.lastIndexOf("/") + 1);

/** Releases grouped by minor line ("0.2"), newest line first. */
export function byLine(rs: Release[]): { line: string; releases: Release[] }[] {
  const out: { line: string; releases: Release[] }[] = [];
  for (const r of rs) {
    const line = r.version.split(".").slice(0, 2).join(".");
    const g = out.find((x) => x.line === line);
    if (g) g.releases.push(r);
    else out.push({ line, releases: [r] });
  }
  return out;
}

/** Runs of consecutive releases (oldest first) that need the same doze. */
export function dozeHistory(rs: Release[]): { from: Release; to: Release; doze: string | null; releases: Release[] }[] {
  const asc = [...rs].reverse();
  const out: { from: Release; to: Release; doze: string | null; releases: Release[] }[] = [];
  for (const r of asc) {
    const last = out[out.length - 1];
    if (last && last.doze === r.doze) {
      last.to = r;
      last.releases.push(r);
    } else out.push({ from: r, to: r, doze: r.doze, releases: [r] });
  }
  return out;
}

/** Engine builds grouped by the engine's major (major_parts dot-parts), newest major first. */
export function engineMajors(m: Module): { major: string; versions: string[]; newest: string }[] {
  const e = engineOf(m);
  if (!e) return [];
  const groups = new Map<string, string[]>();
  for (const v of e.versions) {
    const major = v.split(".").slice(0, e.majorParts).join(".");
    groups.set(major, [...(groups.get(major) ?? []), v]);
  }
  const cmp = (a: string, b: string) => {
    const pa = a.split(/[.-]/).map(Number),
      pb = b.split(/[.-]/).map(Number);
    for (let i = 0; i < Math.max(pa.length, pb.length); i++)
      if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
    return 0;
  };
  return [...groups.entries()]
    .map(([major, versions]) => {
      const sorted = versions.sort(cmp);
      return { major, versions: sorted, newest: sorted[sorted.length - 1] };
    })
    .sort((a, b) => cmp(b.major, a.major));
}

/** Whether `version` takes a quoted string (mariadb "11.4") or a number (postgres 18). */
export const versionIsString = (m: Module) =>
  m.meta.config?.arguments?.find((a: any) => a.name === "version")?.type === "string";

/** doze versions at which "what runs" changes: each release minimum, plus 0.2.0 (the syntax change). */
export function dozeThresholds(rs: Release[]): string[] {
  const set = new Set<string>(["0.2.0"]);
  for (const r of rs) if (r.doze) set.add(r.doze);
  return [...set].sort((a, b) => (semverGte(a, b) ? (a === b ? 0 : 1) : -1));
}

export const numberWord = (n: number) =>
  ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"][n] ?? String(n);

export { display };

// Preview only: MODULE_PREVIEW_DOZE="postgres@0.2.4=0.2.0" pretends a release
// carries an oldest-doze field, to check the "your doze is too old" states
// before any published release sets one. Never set in a real build.
const preview = typeof process !== "undefined" ? process.env.MODULE_PREVIEW_DOZE : undefined;
if (preview) {
  for (const part of preview.split(",")) {
    const hit = part.match(/^(\w+)@([\d.]+)=([\d.]+)$/);
    const r = hit && modules.find((x) => x.name === hit[1])?.releases.find((x) => x.version === hit[2]);
    if (r) r.doze = hit![3];
  }
}
