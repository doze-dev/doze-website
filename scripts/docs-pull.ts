// docs-pull: copy each product's docs (see sources.json) into
// src/content/docs/docs/<name>/, so Starlight serves them at /docs/<name>/.
//
// Locally it reads the sibling checkout (../doze, ../doze-aws, ...) when one
// exists, so a docs edit shows up on the next reload. In CI, or with
// DOCS_SOURCE=git, it shallow-clones each repo at its ref instead.
//
// On the way in it:
//   - gives pages without frontmatter a title taken from their first "# " line
//   - turns README.md into the section's index page
//   - rewrites links so they work under /docs/<name>/
//   - points links at code (not docs) to the file on GitHub
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { Glob } from "bun";

type Source = {
  name: string;
  repo: string;
  ref: string;
  path: string;
  links: "absolute" | "relative";
  keep?: string[];
  exclude?: string[];
  copy?: Record<string, string>;
  also?: string[]; // more folders to fetch in git mode, e.g. images the pages point at
};

const root = resolve(import.meta.dir, "..");
const out = join(root, "src/content/docs/docs");
const cache = join(root, ".cache/sources");
const { sources } = JSON.parse(readFileSync(join(root, "sources.json"), "utf8")) as { sources: Source[] };
const fromGit = process.env.DOCS_SOURCE === "git" || process.env.CI === "true";

async function checkout(s: Source): Promise<{ dir: string; via: string }> {
  const sibling = resolve(root, "..", s.repo.split("/")[1]);
  if (!fromGit && existsSync(join(sibling, s.path))) return { dir: sibling, via: `local ${relative(root, sibling)}` };
  const dir = join(cache, s.name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(cache, { recursive: true });
  const run = (args: string[], cwd?: string) => {
    const p = Bun.spawnSync(["git", ...args], { cwd, stderr: "pipe" });
    if (p.exitCode !== 0) throw new Error(`git ${args.join(" ")}: ${p.stderr.toString()}`);
    return p.stdout.toString().trim();
  };
  const paths = [s.path, ...Object.keys(s.copy ?? {}), ...(s.also ?? [])];
  run([
    "clone",
    "--quiet",
    "--depth=1",
    "--filter=blob:none",
    "--sparse",
    `--branch=${s.ref}`,
    `https://github.com/${s.repo}.git`,
    dir,
  ]);
  run(["sparse-checkout", "set", ...paths], dir);
  return { dir, via: `${s.repo}@${s.ref} (${run(["rev-parse", "--short", "HEAD"], dir)})` };
}

function title(body: string): { title: string; rest: string } | null {
  const m = body.match(/^\s*# (.+)\n/);
  return m ? { title: m[1].trim(), rest: body.slice(m[0].length) } : null;
}

// Links that point at nothing in the source repo, reported after the pull.
const dead: string[] = [];

// rewrite one link target, seen from a page at `page` (path inside the section)
function link(s: Source, base: string, page: string, isIndex: boolean, target: string): string {
  if (/^([a-z]+:|#|mailto:)/i.test(target)) return target;
  const github = (repoPath: string, anchor: string) =>
    `https://github.com/${s.repo}/${/\.[a-z]+$/i.test(repoPath) ? "blob" : "tree"}/${s.ref}/${repoPath}${anchor}`;
  if (target.startsWith("/")) {
    if (s.links !== "absolute" || s.keep?.some((k) => target === k || target.startsWith(`${k}/`))) return target;
    const path = target.split("#")[0].replace(/\/$/, "");
    if (!["", ".md", ".mdx", "/index.md", "/index.mdx"].some((ext) => existsSync(join(base, path + ext))))
      dead.push(`${s.name}/${page}: ${target}`);
    return `/docs/${s.name}${target}`;
  }
  const [file, hash = ""] = target.split("#");
  const anchor = hash ? `#${hash}` : "";
  const inRepo = join(dirname(page), file);
  const excluded = (s.exclude ?? []).some((p) => new Glob(p).match(inRepo) || new Glob(p).match(`${inRepo}/x`));
  if (inRepo.startsWith("..") || excluded) return github(join(s.path, inRepo), anchor); // outside the docs: GitHub
  if (/\.mdx?$/.test(file)) {
    if (!existsSync(join(base, inRepo))) {
      dead.push(`${s.name}/${page}: ${target}`);
      return github(join(s.path, inRepo), anchor);
    }
    const resolved = inRepo.replace(/\.mdx?$/, "");
    const slug = /(^|\/)(readme|index)$/i.test(resolved) ? dirname(resolved).replace(/^\.$/, "") : resolved;
    const from = isIndex ? dirname(page) : page.replace(/\.mdx?$/, "");
    const rel = relative(from === "." ? "" : from.toLowerCase(), slug.toLowerCase());
    return `${rel === "" ? "." : rel}/`.replace(/^(?!\.)/, "./") + anchor;
  }
  if (s.links === "relative") return github(join(s.path, inRepo), anchor); // code or other files
  return target;
}

function rewrite(s: Source, base: string, page: string, isIndex: boolean, text: string): string {
  return text.replace(/(\]\()([^)\s]+)(\))/g, (_m, a, t, b) => `${a}${link(s, base, page, isIndex, t)}${b}`);
}

// Images a page points at with a relative path (in frontmatter or markdown)
// are copied into the section's _assets/ folder, which Starlight does not
// treat as pages, and the path is rewritten to match.
function images(srcFile: string, destFile: string, section: string, text: string): string {
  return text.replace(/(\.{1,2}\/[^\s)"'`]+\.(?:png|jpe?g|svg|webp|gif|avif))/g, (ref) => {
    const from = resolve(dirname(srcFile), ref);
    if (!existsSync(from)) return ref;
    const to = join(section, "_assets", from.split("/").pop() as string);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
    const rel = relative(dirname(destFile), to);
    return rel.startsWith(".") ? rel : `./${rel}`;
  });
}

rmSync(out, { recursive: true, force: true });
const summary: string[] = [];
for (const s of sources) {
  const { dir, via } = await checkout(s);
  const base = join(dir, s.path);
  const skip = (s.exclude ?? []).map((p) => new Glob(p));
  let n = 0;
  for (const file of new Glob("**/*.{md,mdx}").scanSync(base)) {
    if (skip.some((g) => g.match(file))) continue;
    const isIndex = /(^|\/)(readme|index)\.mdx?$/i.test(file);
    const dest = isIndex ? join(dirname(file), file.endsWith(".mdx") ? "index.mdx" : "index.md") : file;
    let text = readFileSync(join(base, file), "utf8");
    if (!text.startsWith("---")) {
      const t = title(text);
      const fallback = isIndex ? s.name : file.replace(/\.mdx?$/, "");
      text = `---\ntitle: ${JSON.stringify(t?.title ?? fallback)}\n---\n${t ? t.rest : text}`;
    }
    const target = join(out, s.name, dest.toLowerCase());
    mkdirSync(dirname(target), { recursive: true });
    text = images(join(base, file), target, join(out, s.name), text);
    writeFileSync(target, rewrite(s, base, file, isIndex, text));
    n++;
  }
  for (const [from, to] of Object.entries(s.copy ?? {})) {
    const src = join(dir, from);
    if (existsSync(src) && statSync(src).isDirectory()) cpSync(src, join(root, "public", to), { recursive: true });
  }
  summary.push(`${s.name.padEnd(6)} ${String(n).padStart(3)} pages  from ${via}`);
}
console.log(`docs-pull\n  ${summary.join("\n  ")}`);
if (dead.length)
  console.warn(
    `\nLinks broken in the source repos (sent to GitHub, or left for check-links to catch):\n  ${dead.join("\n  ")}`,
  );
