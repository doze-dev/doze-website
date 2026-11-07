// The registry search index, built with the site: modules (from the signed index),
// Postgres extensions, bring-your-own tools and the docs pages. /registry/search/
// fetches it and searches in the browser; nothing is sent anywhere.
import { getCollection } from "astro:content";
import { copyFor, moduleHref, runsLine } from "../../components/registry/FindCopy";
import { extensions } from "../../data/extensions";
import { tools } from "../../data/tools";
import { display, fmtDate, look, modules } from "../../lib/registry";

const STOP = new Set(
  "the and for are but not you your with this that from have has was were will can its into when then than they them their there here what which while also only just more most some such each other about over under after before been being does done all any one two out use used uses using doze".split(
    " ",
  ),
);

export async function GET() {
  const docs = (await getCollection("docs")).map((d) => {
    const body = d.body ?? "";
    const headings = [...body.matchAll(/^#{2,3}\s+(.+)$/gm)].map((m) => m[1].replace(/[`*_]/g, "").trim());
    // every distinct word on the page, so "redis" finds the compose guide too
    const words = [
      ...new Set(
        body
          .toLowerCase()
          .replace(/<[^>]+>|\]\([^)]*\)/g, " ")
          .match(/[a-z][a-z0-9_.-]{2,}/g) ?? [],
      ),
    ]
      .map((w) => w.replace(/[.-]+$/, ""))
      .filter((w) => w.length > 2 && !STOP.has(w));
    const parts = d.id.split("/").filter((p) => p !== "index");
    return {
      title: d.data.title,
      description: d.data.description ?? "",
      href: `/${parts.join("/")}/`,
      crumb: parts.map((p) => p.replace(/-/g, " ")).join(" › "),
      headings,
      words: [...new Set(words)].join(" "),
    };
  });

  const index = {
    counts: { modules: modules.length, extensions: extensions.length, tools: tools.length },
    modules: modules.map((m) => {
      const r = m.releases[0];
      const c = copyFor(m);
      return {
        name: m.name,
        id: `${m.namespace}/${m.name}`,
        title: m.meta.title ?? display(m),
        href: moduleHref(m),
        tile: c.tile,
        logo: look[m.name]?.logo ?? null,
        text: c.long,
        aliases: c.aliases,
        meta: [runsLine(m, false), r?.version, fmtDate(r?.date ?? null), r?.doze ? `doze ${r.doze}+` : "any doze"]
          .filter(Boolean)
          .join(" · "),
      };
    }),
    extensions: extensions.map((e) => ({
      name: e.name,
      title: e.title,
      aliases: e.aliases,
      what: e.what,
      majors: e.majors,
      pg: e.pg,
      version: e.version,
      preloads: e.preloads,
      licence: e.licenceLabel,
    })),
    tools: tools.map((t) => ({
      name: t.name,
      title: t.title,
      aliases: t.aliases,
      tagline: t.tagline,
      blurb: t.blurb,
      port: t.port,
      href: `/registry/tools/${t.name}/`,
    })),
    docs,
  };
  return new Response(JSON.stringify(index), { headers: { "content-type": "application/json" } });
}
