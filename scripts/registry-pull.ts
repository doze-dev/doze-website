// registry-pull: the registry as data for the site (src/data/registry.json).
//
// Reads the signed index and meta of every module (doze-registry), the engine
// builds (doze-binaries versions.yaml) and, when GitHub answers, the date each
// module version was uploaded. Like docs-pull: sibling checkouts locally,
// shallow clones in CI (DOCS_SOURCE=git). Nothing here is invented: a value
// that can't be read is left out and the page says so.
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { parse } from "yaml";

const root = resolve(import.meta.dir, "..");
const fromGit = process.env.DOCS_SOURCE === "git" || process.env.CI === "true";
const cache = join(root, ".cache/sources");

function checkout(repo: string, paths: string[]): string {
  const sibling = resolve(root, "..", repo);
  if (!fromGit && paths.every((p) => existsSync(join(sibling, p)))) return sibling;
  const dir = join(cache, repo);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(cache, { recursive: true });
  const git = (args: string[], cwd?: string) => {
    const p = Bun.spawnSync(["git", ...args], { cwd, stderr: "pipe" });
    if (p.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${p.stderr}`);
  };
  git([
    "clone",
    "--quiet",
    "--depth=1",
    "--filter=blob:none",
    "--sparse",
    `https://github.com/doze-dev/${repo}.git`,
    dir,
  ]);
  // --no-cone: paths may be single files (doze-binaries versions.yaml).
  git(["sparse-checkout", "set", "--no-cone", ...paths.map((p) => `/${p}`)], dir);
  return dir;
}

const regDir = checkout("doze-registry", ["registry"]);
const binDir = checkout("doze-binaries", ["versions.yaml"]);
const ns = "doze";
const base = join(regDir, "registry", ns);
// GitHub answers 60 anonymous requests an hour: use GITHUB_TOKEN (CI) or the
// local gh login, and keep what was read in .cache so a later miss loses nothing.
function githubToken(): string | null {
  if (process.env.GITHUB_TOKEN) return process.env.GITHUB_TOKEN;
  const p = Bun.spawnSync(["gh", "auth", "token"], { stderr: "ignore" });
  return p.exitCode === 0 ? p.stdout.toString().trim() || null : null;
}
const token = githubToken();
const ghHeaders: Record<string, string> = {
  accept: "application/vnd.github+json",
  ...(token ? { authorization: `Bearer ${token}` } : {}),
};
const ghCacheFile = join(cache, "github.json");
const ghCache: Record<string, unknown> = existsSync(ghCacheFile) ? JSON.parse(readFileSync(ghCacheFile, "utf8")) : {};
async function github<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`https://api.github.com${path}`, { headers: ghHeaders });
    if (res.ok) {
      const v = (await res.json()) as T;
      ghCache[path] = v;
      return v;
    }
  } catch {}
  return (ghCache[path] as T) ?? null;
}

// upload dates per module version, from GitHub release assets (best effort)
async function uploadDates(tag: string): Promise<Record<string, string>> {
  const rel = await github<{ assets: { name: string; created_at: string }[] }>(
    `/repos/doze-dev/doze-modules/releases/tags/${tag}`,
  );
  const out: Record<string, string> = {};
  for (const a of rel?.assets ?? []) {
    const m = a.name.match(/-plugin-(\d+\.\d+\.\d+)-aarch64-apple-darwin/);
    if (m) out[m[1]] = a.created_at.slice(0, 10);
  }
  return out;
}

type Release = {
  version: string;
  protocol: number;
  engines: string[];
  doze: string | null;
  date: string | null;
  platforms: { triple: string; url: string; sha256: string; sig: string }[];
};
const modules = [];
for (const name of readdirSync(base).sort()) {
  const indexFile = join(base, name, "index.yaml");
  if (!existsSync(indexFile)) continue;
  const index = parse(readFileSync(indexFile, "utf8"));
  const meta = parse(readFileSync(join(base, name, "meta.yaml"), "utf8"));
  const dates = await uploadDates(name);
  const releases: Release[] = Object.entries<any>(index.releases ?? {})
    .map(([version, r]) => ({
      version,
      protocol: r.protocol,
      engines: (r.engines ?? []).map(String),
      doze: r.doze ?? null,
      date: dates[version] ?? null,
      platforms: Object.entries<any>(r.artifacts ?? {}).map(([triple, a]) => ({
        triple,
        url: a.url,
        sha256: a.sha256,
        sig: a.sig,
      })),
    }))
    .sort((a, b) => Bun.semver.order(b.version, a.version));
  modules.push({
    namespace: ns,
    name,
    meta,
    releases,
    newest: releases[0]?.version ?? null,
    signature: index.signature ?? null,
    channels: index.channels ?? {},
  });
}

// doze's own releases (the picker offers them); best effort, like the dates
async function dozeReleases(): Promise<{ version: string; date: string }[]> {
  const rels = await github<{ tag_name: string; published_at: string; draft: boolean; prerelease: boolean }[]>(
    "/repos/doze-dev/doze/releases?per_page=30",
  );
  return (rels ?? [])
    .filter((r) => !r.draft && !r.prerelease && /^v\d+\.\d+\.\d+$/.test(r.tag_name))
    .map((r) => ({ version: r.tag_name.slice(1), date: r.published_at.slice(0, 10) }));
}
const doze = await dozeReleases();

const key = JSON.parse(readFileSync(join(base, "keys.json"), "utf8"));
const binaries = parse(readFileSync(join(binDir, "versions.yaml"), "utf8"));
const engines = Object.fromEntries(
  Object.entries<any>(binaries.engines).map(([e, v]) => [
    e,
    {
      versions: v.versions.map(String),
      triples: v.triples ?? Object.keys(binaries.triples),
      majorParts: v.major_parts ?? 1,
    },
  ]),
);

mkdirSync(cache, { recursive: true });
await Bun.write(ghCacheFile, JSON.stringify(ghCache));
mkdirSync(join(root, "src/data"), { recursive: true });
await Bun.write(
  join(root, "src/data/registry.json"),
  JSON.stringify(
    {
      pulled: new Date().toISOString().slice(0, 10),
      namespace: ns,
      key,
      doze,
      platforms: Object.keys(binaries.triples),
      modules,
      engines,
    },
    null,
    2,
  ),
);
console.log(
  `registry-pull: ${modules.length} modules, ${modules.reduce((n, m) => n + m.releases.length, 0)} releases, ${Object.keys(engines).length} engines`,
);
