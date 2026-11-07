// Starlight route middleware: a product's docs home (/docs/doze/, /docs/aws/,
// /docs/kafka/) is the task launcher of the boards (Docs2Home, Docs2Aws),
// drawn by src/components/docs/DocsHome.astro from src/data/docs-homes.ts,
// in place of the index page pulled from the product's repo. Here it becomes
// an ordinary docs page with the sidebar: no hero, no contents, no
// previous/next, no edit link, and its own title and lede.
import { defineRouteMiddleware } from "@astrojs/starlight/route-data";
import { productFor } from "./components/docs/products";
import { homes } from "./data/docs-homes";

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;
  const product = productFor(context.url.pathname);
  if (!product || context.url.pathname !== product.href) return;
  const data = route.entry.data;
  data.title = `${product.name} docs`;
  data.description = homes[product.id].lede;
  data.template = "doc";
  data.hero = undefined;
  route.hasSidebar = true;
  route.toc = undefined;
  route.editUrl = undefined;
  route.pagination = { prev: undefined, next: undefined };
});
