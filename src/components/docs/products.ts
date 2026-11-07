// The three docs sections: what the switcher, the version chip and the
// breadcrumbs say for each. Topic ids match src/sidebars.ts.
//
// Versions: doze's docs are the 0.2 docs (the site launches with doze 0.2).
// doze AWS and doze Kafka publish their docs from main; the chip names the
// release those docs describe (doze AWS: CHANGELOG's newest section, 1.0.0;
// doze Kafka: the newest tag, 1.2.0, plus Unreleased). Update with releases.
export type DocsProduct = {
  id: "doze" | "aws" | "kafka";
  name: string;
  href: string;
  logo: string;
  version: string;
  older: { label: string; href: string };
};

export const docsProducts: DocsProduct[] = [
  {
    id: "doze",
    name: "doze",
    href: "/docs/doze/",
    logo: "/brand/doze.svg",
    version: "doze 0.2",
    older: { label: "0.1 docs", href: "https://github.com/doze-dev/doze/tree/v0.1.1/docs" },
  },
  {
    id: "aws",
    name: "doze AWS",
    href: "/docs/aws/",
    logo: "/brand/doze-aws.svg",
    version: "doze AWS 0.3",
    older: { label: "older versions", href: "https://github.com/doze-dev/doze-aws/tags" },
  },
  {
    id: "kafka",
    name: "doze Kafka",
    href: "/docs/kafka/",
    logo: "/brand/doze-kafka.svg",
    version: "doze Kafka 1.2",
    older: { label: "older versions", href: "https://github.com/doze-dev/doze-kafka/tags" },
  },
];

/** The section a docs path belongs to: "/docs/aws/lambda/" → doze AWS. */
export function productFor(pathname: string): DocsProduct | undefined {
  return docsProducts.find((p) => pathname.startsWith(p.href));
}
