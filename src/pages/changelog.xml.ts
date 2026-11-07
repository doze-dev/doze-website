// /changelog.xml: an Atom feed of releases, from real sources only: every module
// release in the signed registry index, plus doze, doze AWS and doze Kafka
// releases from GitHub (best effort at build time; skipped if GitHub doesn't answer).
import type { APIRoute } from "astro";
import { display, fmtDate, modules, needs } from "../lib/registry";
import { site } from "../site";

type Entry = { id: string; title: string; date: string; link: string; summary: string };

async function githubReleases(repo: string, product: string): Promise<Entry[]> {
  const headers: Record<string, string> = { accept: "application/vnd.github+json" };
  if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const res = await fetch(`https://api.github.com/repos/doze-dev/${repo}/releases?per_page=20`, { headers });
    if (!res.ok) return [];
    const rels = (await res.json()) as {
      tag_name: string;
      name: string;
      published_at: string;
      html_url: string;
      draft: boolean;
      prerelease: boolean;
    }[];
    // module releases in doze-modules are covered by the registry below
    return rels
      .filter((r) => !r.draft && /^v?\d/.test(r.tag_name))
      .map((r) => ({
        id: r.html_url,
        title: `${product} ${r.tag_name.replace(/^v/, "")}`,
        date: r.published_at,
        link: r.html_url,
        summary: `${product} ${r.tag_name.replace(/^v/, "")} released.`,
      }));
  } catch {
    return [];
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET: APIRoute = async () => {
  const entries: Entry[] = [
    ...(await githubReleases("doze", "doze")),
    ...(await githubReleases("doze-aws", "doze AWS")),
    ...(await githubReleases("doze-kafka", "doze Kafka")),
  ];
  for (const m of modules) {
    for (const r of m.releases) {
      if (!r.date) continue;
      const link = new URL(`/registry/${m.namespace}/${m.name}/${r.version}/`, site.url).href;
      entries.push({
        id: link,
        title: `${display(m)} module ${r.version}`,
        date: `${r.date}T00:00:00Z`,
        link,
        summary: `${display(m)} module ${r.version}, ${fmtDate(r.date)}. Needs ${needs(r)}.`,
      });
    }
  }
  entries.sort((a, b) => b.date.localeCompare(a.date));
  const updated = entries[0]?.date ?? new Date().toISOString();
  const xml = `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>doze changelog</title>
  <link href="${site.url}/changelog/"/>
  <link rel="self" href="${site.url}/changelog.xml"/>
  <id>${site.url}/changelog/</id>
  <updated>${updated}</updated>
${entries
  .map(
    (e) => `  <entry>
    <title>${esc(e.title)}</title>
    <link href="${esc(e.link)}"/>
    <id>${esc(e.id)}</id>
    <updated>${e.date}</updated>
    <summary>${esc(e.summary)}</summary>
  </entry>`,
  )
  .join("\n")}
</feed>
`;
  return new Response(xml, { headers: { "content-type": "application/atom+xml; charset=utf-8" } });
};
