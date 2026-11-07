// Sidebars for the docs sections, built from design/docs-ia.json (product →
// group → pages, in reading order). Slugs are relative to the section, so
// "why/doze" is /docs/doze/why/doze/.

import { existsSync, readFileSync } from "node:fs";

type IA = Record<string, Record<string, { slug: string; title: string }[]>>;
export const ia: IA = JSON.parse(readFileSync(new URL("../design/docs-ia.json", import.meta.url), "utf8"));

// A page can be missing when a product repo is behind the sidebar (the docs
// are pulled from GitHub in CI). Leave it out with a warning instead of
// failing the build.
const docs = new URL("./content/docs/", import.meta.url).pathname;
const has = (slug: string) => [".md", ".mdx", "/index.md", "/index.mdx"].some((ext) => existsSync(docs + slug + ext));

type Item = string | { slug: string; label?: string } | { label: string; collapsed?: boolean; items: Item[] };
type Group = { label: string; collapsed?: boolean; items: Item[] };

const under = (base: string, items: Item[], quiet = false): unknown[] =>
  items.flatMap((it): unknown[] => {
    if (typeof it !== "string" && !("slug" in it)) {
      const inner = under(base, it.items, quiet);
      return inner.length ? [{ ...it, items: inner }] : [];
    }
    const entry = typeof it === "string" ? { slug: it } : it;
    const slug = `${base}/${entry.slug}`;
    if (!has(slug)) {
      if (!quiet) console.warn(`sidebar: no page for ${slug}; left out`);
      return [];
    }
    return [{ ...entry, slug }];
  });

const fromIA = (product: string): Group[] =>
  Object.entries(ia[product]).map(([label, pages]) => ({ label, items: pages.map((p) => p.slug) }));

// doze's sidebar before the docs rebuild (phase D3 of the plan). The new
// groups replace it once at least half their pages exist: until then the new
// slugs are mostly missing, the has() guard would drop them, and the sidebar
// would hide most of today's pages. Delete this list when D3 lands.
const dozeToday: Group[] = [
  { label: "Why doze", items: ["why/doze", "why/not-containers", "why/hcl", "why/alternatives", "why/trust"] },
  {
    label: "Getting started",
    items: ["start/install", "start/getting-started", "start/concepts", "start/from-docker-compose"],
  },
  { label: "The app and the CLI", items: ["cli/tour", "cli/app"] },
  {
    label: "Engines",
    items: [
      { slug: "guides/engines", label: "Overview" },
      ...["postgres", "valkey", "kvrocks", "ferret", "mariadb", "temporal", "kafka", "aws"].map((e) => `engines/${e}`),
    ],
  },
  {
    label: "Guides",
    items: [
      "guides/microservices",
      {
        label: "Recipes",
        collapsed: true,
        items: [
          "microservices-stack",
          "postgres",
          "valkey-kvrocks",
          "documentdb",
          "aws",
          "kafka",
          "stacks",
          "config-layout",
        ].map((r) => `guides/recipes/${r}`),
      },
      "guides/workflows",
      "guides/modules",
      "guides/teams-ci",
      "guides/files-and-storage",
      "guides/resource-footprint",
      "guides/troubleshooting",
      "guides/faq",
    ],
  },
  {
    label: "Building modules",
    items: ["overview", "first-module", "real-engines", "describe", "testing", "releasing", "publishing"].map(
      (m) => `modules/${m}`,
    ),
  },
  {
    label: "How the registry works",
    items: ["operate/trust-architecture", "operate/mirror-binaries", "operate/operations"],
  },
  {
    label: "Reference",
    items: [
      "cli",
      "configuration",
      "lockfile",
      "environment",
      "module-index",
      "binaries",
      "extensions",
      "architecture",
    ].map((r) => `reference/${r}`),
  },
];

const dozeNew = Object.values(ia.doze).flat();
const dozeWritten = dozeNew.filter((p) => has(`docs/doze/${p.slug}`)).length;
const dozeGroups = dozeWritten * 2 >= dozeNew.length ? fromIA("doze") : dozeToday;
if (dozeGroups === dozeToday)
  console.warn(`sidebar: ${dozeWritten} of ${dozeNew.length} new doze pages written; showing today's groups`);

export const topics = [
  {
    id: "doze",
    label: "doze",
    link: "/docs/doze/",
    icon: "seti:config",
    items: under("docs/doze", dozeGroups as Item[], dozeGroups !== dozeToday),
  },
  {
    id: "aws",
    label: "doze AWS",
    link: "/docs/aws/",
    icon: "seti:json",
    items: under("docs/aws", fromIA("aws") as Item[]),
  },
  {
    id: "kafka",
    label: "doze Kafka",
    link: "/docs/kafka/",
    icon: "seti:pipeline",
    items: under("docs/kafka", fromIA("kafka") as Item[]),
  },
];
