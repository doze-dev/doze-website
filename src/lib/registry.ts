// The registry as the site sees it: src/data/registry.json (written by
// scripts/registry-pull.ts from the signed index) plus the few things the index
// doesn't carry yet, kept here in one place and named as such.
import data from "../data/registry.json";

export type Platform = { triple: string; url: string; sha256: string; sig: string };
export type Release = {
  version: string;
  protocol: number;
  engines: string[];
  doze: string | null;
  date: string | null;
  platforms: Platform[];
};
export type Module = {
  namespace: string;
  name: string;
  meta: any;
  releases: Release[];
  newest: string | null;
  signature: string | null;
  channels: Record<string, string>;
};

export const registry = data as unknown as {
  pulled: string;
  namespace: string;
  key: { namespace: string; key: string };
  doze: { version: string; date: string }[];
  platforms: string[];
  modules: Module[];
  engines: Record<string, { versions: string[]; triples: string[]; majorParts: number }>;
};

export const modules: Module[] = registry.modules;
export const getModule = (name: string) => modules.find((m) => m.name === name);

/** How each module looks on cards: a logo, or a coloured tile with its initial. Not in the index. */
export const look: Record<string, { tile?: string; logo?: string; display: string; engine?: string }> = {
  postgres: { tile: "#336791", display: "PostgreSQL", engine: "Postgres" },
  valkey: { tile: "#4C55C8", display: "Valkey", engine: "Valkey" },
  kvrocks: { tile: "#2B6E64", display: "Kvrocks", engine: "Kvrocks" },
  ferret: { tile: "#2F5F3A", display: "FerretDB", engine: "FerretDB" },
  mariadb: { tile: "#1F4F66", display: "MariaDB", engine: "MariaDB" },
  temporal: { tile: "#24242B", display: "Temporal", engine: "Temporal CLI" },
  kafka: { logo: "/brand/doze-kafka.svg", display: "doze Kafka" },
  aws: { logo: "/brand/doze-aws.svg", display: "doze AWS" },
};
export const display = (m: Module) => look[m.name]?.display ?? m.meta.title ?? m.name;

/** "any doze" when a release sets no minimum, else "doze 0.2.0 or newer". */
export const needs = (r: Release) => (r.doze ? `doze ${r.doze} or newer` : "any doze");

/** Whether doze version `have` runs release r (a release with no minimum runs on any doze). */
export const runsOn = (r: Release, have: string) => !r.doze || semverGte(have, r.doze);
export function semverGte(a: string, b: string): boolean {
  const pa = a.split(".").map(Number),
    pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) > (pb[i] ?? 0);
  return true;
}

/** "Postgres 14 – 18", "Valkey 8 – 9", or "runs itself" for modules with no engine binary. */
export function engineRange(m: Module): string {
  const r = m.releases[0];
  const name = look[m.name]?.engine;
  if (!r || !r.engines.length || !name) return "runs itself";
  const e = r.engines;
  return e.length === 1 ? `${name} ${e[0]}` : `${name} ${e[0]} – ${e[e.length - 1]}`;
}

export const platformLabel: Record<string, string> = {
  "aarch64-apple-darwin": "macOS arm64",
  "aarch64-unknown-linux-gnu": "Linux arm64",
  "x86_64-unknown-linux-gnu": "Linux x86_64",
};

export const fmtDate = (d: string | null) =>
  d
    ? new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      })
    : "[date]";
