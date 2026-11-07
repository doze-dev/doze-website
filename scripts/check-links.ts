// check-links: every internal link and asset in the built site (dist/) must
// resolve to a file, or match a rule in public/_redirects. External links are
// not fetched here. Exits 1 and lists each broken link with the page it is on.
//
// The docs are being rebuilt to design/docs-ia.json. A page planned there but
// not written yet is a known TODO, not a failure: links to it are listed
// apart, with every other planned page still missing.
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

// Planned docs pages: /docs/<product>/<slug>/ for every page in docs-ia.json.
const ia = JSON.parse(readFileSync(resolve(import.meta.dir, "../design/docs-ia.json"), "utf8")) as Record<
  string,
  Record<string, { slug: string }[]> | string
>;
const planned = new Set(
  Object.entries(ia).flatMap(([product, groups]) =>
    typeof groups === "string"
      ? []
      : Object.values(groups).flatMap((ps) => ps.map((p) => `/docs/${product}/${p.slug}/`)),
  ),
);

const exists = (path: string) => {
  const p = decodeURIComponent(path);
  return [p, join(p, "index.html"), `${p}.html`].some((c) => existsSync(join(dist, c)));
};
const redirected = (path: string) =>
  redirects.some((r) => (r.endsWith("*") ? path.startsWith(r.slice(0, -1)) : path === r));

const broken = new Map<string, string[]>();
const todo = new Map<string, string[]>();
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
    const into = planned.has(url.pathname) ? todo : broken;
    const pages = into.get(url.pathname) ?? [];
    pages.push(page);
    into.set(url.pathname, pages);
  }
}
if (checked === 0) {
  console.error("check-links: no links found in dist/; did the build fail?");
  process.exit(2);
}
const unwritten = [...planned].filter((p) => !exists(p)).sort();
if (unwritten.length) {
  console.log(
    `check-links: TODO, ${unwritten.length} of ${planned.size} planned docs pages (design/docs-ia.json) not written yet`,
  );
  for (const p of unwritten)
    console.log(`  ${p}${todo.has(p) ? `  (linked from ${[...new Set(todo.get(p))].slice(0, 3).join(", ")})` : ""}`);
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
