// Sidebars for the docs sections. doze's order is written by hand (it is a
// reading order); doze AWS and doze Kafka list their pages until they grow
// one. Slugs are relative to the section, so "why/doze" is /docs/doze/why/doze/.

import { existsSync } from "node:fs";

// A page can be missing when a product repo is behind the sidebar (the docs
// are pulled from GitHub in CI). Leave it out with a warning instead of
// failing the build.
const docs = new URL("./content/docs/", import.meta.url).pathname;
const has = (slug: string) =>
  [".md", ".mdx", "/index.md", "/index.mdx"].some((ext) => existsSync(docs + slug + ext));

type Item = string | { slug: string; label?: string } | { label: string; collapsed?: boolean; items: Item[] };
type Group = { label: string; collapsed?: boolean; items: Item[] };

const under = (base: string, items: Item[]): unknown[] =>
  items.flatMap((it) => {
    if (typeof it !== "string" && !("slug" in it)) return [{ ...it, items: under(base, it.items) }];
    const entry = typeof it === "string" ? { slug: it } : it;
    const slug = `${base}/${entry.slug}`;
    if (!has(slug)) {
      console.warn(`sidebar: no page for ${slug}; left out`);
      return [];
    }
    return [{ ...entry, slug }];
  });

const dozeGroups: Group[] = [
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
    collapsed: true,
    items: ["overview", "first-module", "real-engines", "describe", "testing", "releasing", "publishing"].map(
      (m) => `modules/${m}`,
    ),
  },
  {
    label: "How the registry works",
    collapsed: true,
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

export const topics = [
  {
    id: "doze",
    label: "doze",
    link: "/docs/doze/",
    icon: "seti:config",
    items: under("docs/doze", dozeGroups as Item[]),
  },
  {
    id: "aws",
    label: "doze AWS",
    link: "/docs/aws/",
    icon: "seti:json",
    items: [{ autogenerate: { directory: "docs/aws" } }],
  },
  {
    id: "kafka",
    label: "doze Kafka",
    link: "/docs/kafka/",
    icon: "seti:pipeline",
    items: [{ autogenerate: { directory: "docs/kafka" } }],
  },
];
