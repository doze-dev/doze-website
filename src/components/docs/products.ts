// The three docs sections: what the docs bar, the breadcrumbs and the homes
// say for each. Topic ids match src/sidebars.ts.
//
// Versions: doze's docs are the 0.2 docs (the site launches with doze 0.2).
// doze AWS and doze Kafka publish their docs from main; the pill names the
// release those docs describe (doze AWS: v0.3.0, its newest tag; doze Kafka:
// v1.2.0, its newest tag). Update with releases.
export type DocsProduct = {
  id: "doze" | "aws" | "kafka";
  name: string;
  href: string;
  logo: string;
  version: string;
  /** Where older releases are listed (the version menu links it). */
  releases: string;
};

export const docsProducts: DocsProduct[] = [
  {
    id: "doze",
    name: "doze",
    href: "/docs/doze/",
    logo: "/brand/doze.svg",
    version: "0.2",
    releases: "/changelog/",
  },
  {
    id: "aws",
    name: "doze AWS",
    href: "/docs/aws/",
    logo: "/brand/doze-aws.svg",
    version: "0.3",
    releases: "https://github.com/doze-dev/doze-aws/releases",
  },
  {
    id: "kafka",
    name: "doze Kafka",
    href: "/docs/kafka/",
    logo: "/brand/doze-kafka.svg",
    version: "1.2",
    releases: "https://github.com/doze-dev/doze-kafka/releases",
  },
];

/** The section a docs path belongs to: "/docs/aws/lambda/" → doze AWS. */
export function productFor(pathname: string): DocsProduct | undefined {
  return docsProducts.find((p) => pathname.startsWith(p.href));
}

/** Is this path a product's docs home (/docs/doze/)? */
export const isHome = (pathname: string) => docsProducts.some((p) => p.href === pathname);
