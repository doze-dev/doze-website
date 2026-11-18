// The Larder Map, from the doze repo's `make docs-shots` (website/src/assets/app/view-map.webp).

// What the docs home (/docs/doze/) and the /docs landing say and link to
// (boards Docs2Home, Docs2Landing).
//
// Every docs link goes through `pages` below: one map per product from a short
// key to the page's slug in the new information architecture
// (design/docs-ia.json). Until a new page is written, `today` names the page
// that covers it now, and the link goes there; scripts/check-links.ts lists
// the new slugs still missing. Change a destination here, nowhere else.
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { ImageMetadata } from "astro";
import ia from "../../design/docs-ia.json";
import viewMap from "../assets/docs/view-map.webp";

type Product = "doze";
type PageRef = { slug: string; today?: string; label?: string };

export const pages: Record<Product, Record<string, PageRef>> = {
  doze: {
    install: { slug: "start/install" },
    firstStack: { slug: "start/first-stack", today: "start/getting-started" },
    yourRepo: { slug: "start/your-repo", today: "start/from-docker-compose" },
    views: { slug: "app/views", today: "cli/app" },
    breaks: { slug: "app/when-something-breaks", today: "guides/troubleshooting" },
    services: { slug: "services/postgres", today: "guides/engines", label: "Services" },
    domains: { slug: "app/domains", today: "cli/domains" },
    keys: { slug: "app/keys", today: "cli/app" },
    cli: { slug: "reference/cli" },
    hcl: { slug: "reference/doze-hcl", today: "reference/configuration" },
    env: { slug: "reference/environment" },
    lock: { slug: "reference/lockfile" },
  },
};

// From the project root: this module is bundled, so import.meta.url would
// point into the build output.
const content = join(process.cwd(), "src/content/docs/docs/");
const exists = (product: Product, slug: string) =>
  [".md", ".mdx", "/index.md", "/index.mdx"].some((ext) => existsSync(`${content}${product}/${slug}${ext}`));

/** A page by its key: its URL (the new page, or today's until it is written)
 * and where it sits ("Start here › Your first stack", from docs-ia.json). */
export function page(product: Product, key: string): { href: string; where: string; title: string } {
  const ref = pages[product][key];
  if (!ref) throw new Error(`docs-homes: no page "${key}" for ${product}`);
  const slug = exists(product, ref.slug) || !ref.today || !exists(product, ref.today) ? ref.slug : ref.today;
  const groups = (ia as unknown as Record<string, Record<string, { slug: string; title: string }[]>>)[product];
  const [group, list] = Object.entries(groups).find(([, l]) => l.some((p) => p.slug === ref.slug)) ?? ["", []];
  const title = list.find((p) => p.slug === ref.slug)?.title ?? ref.slug;
  return { href: `/docs/${product}/${slug}/`, where: ref.label ?? `${group} › ${title}`, title };
}

// Inline SVG icons for the "I want to…" cards (24×24, stroked).
export const icons: Record<string, string> = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  folder: '<path d="M3 7h6l2 2h10v10H3z"/>',
  grid: '<rect x="3" y="4" width="7" height="7" rx="1"/><rect x="14" y="4" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  warn: '<path d="M12 3 2 20h20z"/><path d="M12 10v4M12 17h.01"/>',
  db: '<ellipse cx="12" cy="6" rx="8" ry="3"/><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
};

export type Home = {
  product: Product;
  /** The lede under "<product> docs"; plain text. */
  lede: string;
  start: { key: string; title: string; text: string }[];
  /** Beside the steps: a screenshot or a terminal. */
  shot?: { src: string | ImageMetadata; alt: string; caption: string };
  code?: string[];
  want: { key: string; title: string; text: string; icon?: string }[];
  look: { key: string; label: string; text: string }[];
  /** doze: what is new (HTML, this file's own strings). */
  news?: { items: string[]; note: string };
};

export const homes: Record<Product, Home> = {
  doze: {
    product: "doze",
    lede: "doze runs your whole stack on your laptop: your apps, Postgres, Kafka, a local AWS. Each service wakes when called and sleeps when nothing uses it. Start in the app; every step is a command too.",
    start: [
      {
        key: "install",
        title: "Install the app",
        text: "One Homebrew line on a Mac with Apple silicon. Linux and the CLI on their own are on the same page.",
      },
      {
        key: "firstStack",
        title: "Your first stack",
        text: "Open a project, flip it Up, and watch each service wake on the map.",
      },
      {
        key: "yourRepo",
        title: "Bring your own repo",
        text: "Drop your folder on the window. doze shows what it found and writes <code>doze.hcl</code>. Coming from docker-compose is covered here too.",
      },
    ],
    shot: {
      src: viewMap,
      alt: "The doze app showing the larder stack on the Map: storefront calls gateway, gateway calls the other services, and the shared postgres, redis, kafka, aws and mailpit along the bottom",
      caption:
        "A stack on the Map: who calls whom, what each uses, and its memory. Larder is a made-up grocery app we use in examples.",
    },
    want: [
      {
        key: "firstStack",
        icon: "arrow",
        title: "Start my first stack",
        text: "Open the Larder example and bring it up in the app.",
      },
      {
        key: "yourRepo",
        icon: "folder",
        title: "Bring my repo",
        text: "Add your project, with or without a compose file.",
      },
      {
        key: "views",
        icon: "grid",
        title: "See what's running",
        text: "Tiles, List, Map and Grid: four views of the same stack.",
      },
      {
        key: "breaks",
        icon: "warn",
        title: "Fix something that broke",
        text: "A crash, a port already taken, a doze.hcl saved broken.",
      },
      {
        key: "services",
        icon: "db",
        title: "Add Postgres, Kafka or AWS",
        text: "One block in doze.hcl, or <code>doze add postgres</code>.",
      },
      {
        key: "domains",
        icon: "lock",
        title: "Use my own domain",
        text: "A real name like dev.acme.com, over https, on your machine.",
      },
    ],
    look: [
      { key: "cli", label: "CLI", text: "every <code>doze</code> command and flag" },
      { key: "hcl", label: "doze.hcl", text: "every block and field" },
      { key: "env", label: "Environment", text: "what doze reads and sets" },
      { key: "lock", label: "doze.lock", text: "the two pin layers" },
      { key: "keys", label: "⌘K and keys", text: "every key in the app" },
    ],
    news: {
      items: [
        "<b>The app, redrawn.</b> The Library first, then Tiles, List and Map per stack, and ⌘K across every stack.",
        "<b><code>doze</code> opens the app.</b> Over SSH it is still the terminal dash.",
        '<b>Your own domain, over https.</b> <code>domains = ["dev.acme.com"]</code> on an app, then <code>doze trust</code>.',
        "<b>One word for order.</b> <code>after</code> replaces <code>depends_on</code>.",
        "<b>Mistakes say what to do.</b> The file, the line and the fix.",
        "<b>Services sleep after 2 minutes,</b> not 5.",
      ],
      note: '0.2 is the next release; it is not out yet. <a href="/changelog/">The full changelog →</a>',
    },
  },
};

// The /docs landing (Docs2Landing).
export const landing = {
  tries: [
    { q: "sleep", product: "doze" },
    { q: "DATABASE_URL", product: "doze" },
    { q: "doze.lock", product: "doze" },
  ] as { q: string; product: Product }[],
  doors: {
    doze: { sub: "the app and the CLI", keys: ["install", "firstStack", "yourRepo", ["hcl", "doze.hcl reference"]] },
  } as Record<Product, { sub: string; keys: (string | [string, string])[] }>,
  picked: [
    { product: "doze", key: "breaks", title: "When something breaks" },
    { product: "doze", key: "services", title: "Postgres, Valkey and the other services" },
    { product: "doze", key: "domains", title: "Your own domain, over https" },
    { product: "doze", key: "env", title: "Environment variables" },
    { product: "doze", key: "lock", title: "doze.lock" },
    { product: "doze", key: "keys", title: "⌘K and keys" },
  ] as { product: Product; key: string; title: string }[],
};
