// check-links: every internal link and asset in the built site (dist/) must
// resolve to a file, or match a rule in public/_redirects. External links are
// not fetched here. Exits 1 and lists each broken link with the page it is on.
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Glob } from "bun";

const dist = resolve(import.meta.dir, "../dist");
if (!existsSync(dist)) {
  console.error("check-links: no dist/; run `bun run build` first");
  process.exit(2);
}
const redirects = readFileSync(resolve(import.meta.dir, "../public/_redirects"), "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"))
  .map((l) => l.trim().split(/\s+/)[0]);

const exists = (path: string) => {
  const p = decodeURIComponent(path);
  return [p, join(p, "index.html"), `${p}.html`].some((c) => existsSync(join(dist, c)));
};
const redirected = (path: string) =>
  redirects.some((r) => (r.endsWith("*") ? path.startsWith(r.slice(0, -1)) : path === r));

const broken = new Map<string, string[]>();
let checked = 0;
for (const file of new Glob("**/*.html").scanSync(dist)) {
  const html = readFileSync(join(dist, file), "utf8");
  const page = `/${file.replace(/index\.html$/, "")}`;
  for (const m of html.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const raw = m[1];
    if (/^(?:[a-z]+:|\/\/|#|data:)/i.test(raw)) continue;
    const url = new URL(raw, `https://x${page}`);
    checked++;
    if (exists(url.pathname) || redirected(url.pathname)) continue;
    const pages = broken.get(url.pathname) ?? [];
    pages.push(page);
    broken.set(url.pathname, pages);
  }
}
if (checked === 0) {
  console.error("check-links: no links found in dist/; did the build fail?");
  process.exit(2);
}
if (broken.size === 0) {
  console.log(`check-links: ${checked} internal links, all resolve`);
  process.exit(0);
}
console.error(`check-links: ${broken.size} broken targets\n`);
for (const [target, pages] of [...broken].sort()) {
  console.error(
    `  ${target}\n    on ${[...new Set(pages)].slice(0, 4).join(", ")}${pages.length > 4 ? ` and ${pages.length - 4} more` : ""}`,
  );
}
process.exit(1);
