// The docs sections: what the docs bar, the breadcrumbs and the homes say
// for each. Topic ids match src/sidebars.ts.
//
// Versions: doze's docs are the 0.2 docs (the site launches with doze 0.2).
export type DocsProduct = {
  id: "doze";
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
];

/** The section a docs path belongs to: "/docs/doze/hcl/apps/" → doze. */
export function productFor(pathname: string): DocsProduct | undefined {
  return docsProducts.find((p) => pathname.startsWith(p.href));
}

/** Is this path a product's docs home (/docs/doze/)? */
export const isHome = (pathname: string) => docsProducts.some((p) => p.href === pathname);
