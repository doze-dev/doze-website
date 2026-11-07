// check-slugs: every docs address in the committed baseline
// (design/docs-slugs.txt) must still answer: a built page in dist/, or a rule
// in public/_redirects (docs-pull writes one per `redirect_from`). A page
// that moves without a redirect_from fails here, so old links never 404.
//
//   bun scripts/check-slugs.ts          check dist/ against the baseline
//   bun scripts/check-slugs.ts --write  add the pulled docs' addresses to the baseline
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { Glob } from "bun";

const root = resolve(import.meta.dir, "..");
const baseline = join(root, "design/docs-slugs.txt");
const dist = join(root, "dist");

if (process.argv.includes("--write")) {
  const content = join(root, "src/content/docs/docs");
  const urls = [...new Glob("**/*.{md,mdx}").scanSync(content)]
    .filter((f) => !f.split("/").some((p) => p.startsWith("_")))
    .map((f) => {
      const slug = f.replace(/\.mdx?$/, "").replace(/(^|\/)index$/, "");
      return `/docs/${slug}${slug ? "/" : ""}`.toLowerCase();
    });
  const old = existsSync(baseline)
    ? readFileSync(baseline, "utf8")
        .split("\n")
        .filter((l) => l.startsWith("/"))
    : [];
  const all = [...new Set([...old, ...urls])].sort();
  writeFileSync(
    baseline,
    `# Every docs address that has existed: check-slugs.ts fails if one stops answering\n# (no page, no redirect). --write adds today's pages; it never removes a line.\n${all.join("\n")}\n`,
  );
  console.log(`check-slugs: ${all.length - old.length} new, ${all.length} addresses to design/docs-slugs.txt`);
  process.exit(0);
}

if (!existsSync(dist)) {
  console.error("check-slugs: no dist/; run `bun run build` first");
  process.exit(2);
}
const rules = readFileSync(join(root, "public/_redirects"), "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"))
  .map((l) => l.trim().split(/\s+/)[0]);
const redirected = (path: string) =>
  rules.some((r) => (r.endsWith("*") ? path.startsWith(r.slice(0, -1)) : path === r));
const built = (path: string) => existsSync(join(dist, path, "index.html"));

const urls = readFileSync(baseline, "utf8")
  .split("\n")
  .filter((l) => l.trim() && !l.startsWith("#"));
const lost = urls.filter((u) => !built(u) && !redirected(u));
if (lost.length === 0) {
  console.log(`check-slugs: ${urls.length} docs addresses, all answer`);
  process.exit(0);
}
console.error(
  `check-slugs: ${lost.length} docs addresses answer nothing (give the page that replaced each a redirect_from):\n  ${lost.join("\n  ")}`,
);
process.exit(1);
