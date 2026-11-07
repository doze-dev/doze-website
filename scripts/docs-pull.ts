// docs-pull: copy each product's docs (see sources.json) into
// src/content/docs/docs/<name>/, so Starlight serves them at /docs/<name>/.
//
// Locally it reads the sibling checkout (../doze, ../doze-aws, ...) when one
// exists, so a docs edit shows up on the next reload. In CI, or with
// DOCS_SOURCE=git, it shallow-clones each repo at its ref instead.
//
// DOCS_LOCAL_<NAME>=/abs/path (e.g. DOCS_LOCAL_AWS, DOCS_LOCAL_KAFKA) reads
// that one source from the given checkout instead, in any mode: use it to
// preview docs from a worktree or branch before they land on the ref.
//
// On the way in it:
//   - gives pages without frontmatter a title taken from their first "# " line
//   - turns README.md into the section's index page
//   - rewrites links so they work under /docs/<name>/
//   - points links at code (not docs) to the file on GitHub
//   - copies the images pages point at into the section's _assets/ folder
//   - turns each page's `redirect_from` (its old addresses) into 301s in the
//     generated block of public/_redirects
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { Glob } from "bun";
import { parse as parseYaml } from "yaml";

type Source = {
  name: string;
  repo: string;
  ref: string;
  path: string;
  links: "absolute" | "relative";
  keep?: string[];
  exclude?: string[];
  copy?: Record<string, string>;
  files?: Record<string, string>; // single files to copy into public/, links rewritten
  also?: string[]; // more folders to fetch in git mode, e.g. images the pages point at
};

const root = resolve(import.meta.dir, "..");
const out = join(root, "src/content/docs/docs");
const cache = join(root, ".cache/sources");
const { sources } = JSON.parse(readFileSync(join(root, "sources.json"), "utf8")) as { sources: Source[] };
const fromGit = process.env.DOCS_SOURCE === "git" || process.env.CI === "true";

async function checkout(s: Source): Promise<{ dir: string; via: string }> {
  const override = process.env[`DOCS_LOCAL_${s.name.toUpperCase()}`];
  if (override) {
    if (!existsSync(join(override, s.path)))
      throw new Error(`DOCS_LOCAL_${s.name.toUpperCase()}: no ${s.path} in ${override}`);
    return { dir: resolve(override), via: `override ${override}` };
  }
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
  const body = text.replace(/(\]\()([^)\s]+)(\))/g, (_m, a, t, b) => `${a}${link(s, base, page, isIndex, t)}${b}`);
  // Frontmatter links (a splash page's hero actions: `link: /start/x/`) need
  // the same treatment as markdown links, or they point outside /docs/<name>/.
  const end = body.startsWith("---") ? body.indexOf("\n---", 3) : -1;
  if (end < 0) return body;
  const front = body
    .slice(0, end)
    .replace(/^(\s*link:\s*)(\S+)\s*$/gm, (_m, a, t) => `${a}${link(s, base, page, isIndex, t)}`);
  return front + body.slice(end);
}

// Each page's "Edit this page on GitHub" goes to its file in its own repo.
// Starlight reads `editUrl` from the frontmatter; a page that sets its own keeps it.
function withEditUrl(s: Source, file: string, text: string): string {
  const end = text.indexOf("\n---", 3);
  if (/^editUrl:/m.test(text.slice(0, end))) return text;
  const url = `https://github.com/${s.repo}/edit/${s.ref}/${join(s.path, file)}`;
  return `---\neditUrl: ${JSON.stringify(url)}${text.slice(3)}`;
}

// Images a page points at with a relative path (in frontmatter, markdown or
// an MDX import) are copied into the section's _assets/ folder, which
// Starlight does not treat as pages, and the path is rewritten to match. Each
// keeps its path inside the source repo (_assets/website/src/assets/app/x.webp),
// so two images with the same file name never overwrite each other.
function images(repo: string, srcFile: string, destFile: string, section: string, text: string): string {
  return text.replace(/(\.{1,2}\/[^\s)"'`]+\.(?:png|jpe?g|svg|webp|gif|avif))/g, (ref) => {
    const from = resolve(dirname(srcFile), ref);
    if (!existsSync(from)) return ref;
    const inRepo = relative(repo, from);
    const to = join(section, "_assets", inRepo.startsWith("..") ? (from.split("/").pop() as string) : inRepo);
    mkdirSync(dirname(to), { recursive: true });
    cpSync(from, to);
    const rel = relative(dirname(destFile), to);
    return rel.startsWith(".") ? rel : `./${rel}`;
  });
}

// A page's old addresses, from `redirect_from` in its frontmatter. They are
// written like the page's own links in that source: from the section's root
// ("/start/getting-started/") when links are absolute, from the page's own
// folder ("old-name.md") when they are relative.
const redirects: { from: string; to: string; page: string }[] = [];
function redirectsOf(s: Source, file: string, url: string, text: string) {
  if (!text.startsWith("---")) return;
  const end = text.indexOf("\n---", 3);
  let list: unknown;
  try {
    list = (parseYaml(text.slice(3, end)) as Record<string, unknown> | null)?.redirect_from;
  } catch {
    return;
  }
  if (list === undefined) return;
  if (!Array.isArray(list)) {
    dead.push(`${s.name}/${file}: redirect_from must be a list`);
    return;
  }
  for (const raw of list.map(String)) {
    const path =
      raw.startsWith("/") || s.links === "absolute"
        ? raw
        : `/${join(dirname(file), raw)
            .replace(/\.mdx?$/, "")
            .replace(/(^|\/)(readme|index)$/i, "")}`;
    if (!path.startsWith("/") || path.includes("..")) {
      dead.push(`${s.name}/${file}: redirect_from ${raw} is outside the section`);
      continue;
    }
    const from = `/docs/${s.name}${path.toLowerCase()}/`.replace(/\/+/g, "/");
    redirects.push({ from, to: url, page: `${s.name}/${file}` });
  }
}

// The generated block in public/_redirects, between these two lines; the
// hand-written rules outside it are left alone.
const BEGIN = "# BEGIN docs-pull redirects";
const END = "# END docs-pull redirects";
function writeRedirects(pages: Set<string>) {
  const file = join(root, "public/_redirects");
  const text = existsSync(file) ? readFileSync(file, "utf8") : "";
  const seen = new Map<string, string>();
  const lines: string[] = [];
  for (const r of redirects) {
    if (pages.has(r.from)) {
      console.warn(`redirects: ${r.page} claims ${r.from}, which is a page; skipped`);
      continue;
    }
    const other = seen.get(r.from);
    if (other && other !== r.to) {
      console.warn(`redirects: ${r.from} is claimed by ${other} and ${r.to}; kept the first`);
      continue;
    }
    if (other) continue;
    seen.set(r.from, r.to);
    lines.push(`${r.from}  ${r.to}  301`);
  }
  const block = [
    BEGIN,
    "# Written by scripts/docs-pull.ts from each page's redirect_from. Do not edit by hand.",
    ...lines.sort(),
    END,
  ].join("\n");
  const at = text.indexOf(BEGIN);
  const stop = text.indexOf(END);
  const next =
    at >= 0 && stop > at
      ? text.slice(0, at) + block + text.slice(stop + END.length)
      : `${text.replace(/\n*$/, "\n\n")}${block}\n`;
  if (next !== text) writeFileSync(file, next);
  return lines.length;
}

rmSync(out, { recursive: true, force: true });
const summary: string[] = [];
const pageUrls = new Set<string>();
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
    text = withEditUrl(s, file, text);
    const target = join(out, s.name, dest.toLowerCase());
    mkdirSync(dirname(target), { recursive: true });
    text = images(dir, join(base, file), target, join(out, s.name), text);
    const slug = dest
      .toLowerCase()
      .replace(/\.mdx?$/, "")
      .replace(/(^|\/)index$/, "");
    const url = `/docs/${s.name}/${slug ? `${slug}/` : ""}`;
    pageUrls.add(url);
    redirectsOf(s, file, url, text);
    writeFileSync(target, rewrite(s, base, file, isIndex, text));
    n++;
  }
  // single files (e.g. llms.txt): from the checkout, or from GitHub at the ref;
  // markdown links in them are rewritten like the pages'.
  for (const [from, to] of Object.entries(s.files ?? {})) {
    const local = join(dir, from);
    const text = existsSync(local)
      ? readFileSync(local, "utf8")
      : await fetch(`https://raw.githubusercontent.com/${s.repo}/${s.ref}/${from}`).then((r) => (r.ok ? r.text() : ""));
    if (text) writeFileSync(join(root, "public", to), rewrite(s, base, to, false, text));
  }
  for (const [from, to] of Object.entries(s.copy ?? {})) {
    const src = join(dir, from);
    if (existsSync(src) && statSync(src).isDirectory()) cpSync(src, join(root, "public", to), { recursive: true });
  }
  summary.push(`${s.name.padEnd(6)} ${String(n).padStart(3)} pages  from ${via}`);
}
const nRedirects = writeRedirects(pageUrls);
console.log(`docs-pull\n  ${summary.join("\n  ")}\n  ${nRedirects} redirects from redirect_from`);
if (dead.length)
  console.warn(
    `\nLinks broken in the source repos (sent to GitHub, or left for check-links to catch):\n  ${dead.join("\n  ")}`,
  );
