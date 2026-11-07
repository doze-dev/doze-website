// Registry search in the browser: reads ?q=, searches /registry/search.json and
// draws the results grouped by kind, each saying why it matched; or the
// nothing-found page. No query or result leaves the browser.
export {};

type Alias = { term: string; why: string };
type ModuleItem = {
  name: string;
  id: string;
  title: string;
  href: string;
  tile: string;
  logo: string | null;
  text: string;
  aliases: Alias[];
  meta: string;
};
type ExtItem = {
  name: string;
  title: string;
  aliases: string[];
  what: string;
  majors: string;
  pg: number[];
  version: string;
  preloads: boolean;
  licence: string;
};
type ToolItem = {
  name: string;
  title: string;
  aliases: string[];
  tagline: string;
  blurb: string;
  port: number;
  href: string;
};
type DocItem = { title: string; description: string; href: string; crumb: string; headings: string[]; words: string };
type Index = {
  counts: { modules: number; extensions: number; tools: number };
  modules: ModuleItem[];
  extensions: ExtItem[];
  tools: ToolItem[];
  docs: DocItem[];
};
type Hit = { kind: "mods" | "exts" | "byo" | "docs"; score: number; el: HTMLElement };

// Things people search for that doze runs only as a hand-written service.
const byHand: Record<
  string,
  { bin: string; what: string; run: string; port: number; swap?: { name: string; href: string } }
> = {
  redis: {
    bin: "redis-server",
    what: "your own Redis, run as a doze service",
    run: "redis-server --bind $HOST --port $PORT --dir $DATA",
    port: 6379,
    swap: { name: "Valkey", href: "/registry/doze/valkey/" },
  },
};
// Conventional ports, for the nothing-found page's `doze add <name> --port`.
const ports: Record<string, number> = {
  cassandra: 9042,
  scylla: 9042,
  scylladb: 9042,
  elasticsearch: 9200,
  couchdb: 5984,
  neo4j: 7687,
  influxdb: 8086,
};
// What the nothing-found page says beyond "no near spelling", where the board said it.
const nearNotes: Record<string, string> = {
  cassandra:
    "No near spelling, and no other wide-column database either: ScyllaDB isn't in the registry. The nearest thing doze runs on disk is Kvrocks, but it speaks Redis, not CQL, so it is not a substitute.",
};
const runHints: Record<string, string> = { cassandra: "Cassandra's is bin/cassandra -f, port set in its config" };

// ---- small DOM helpers
type Kid = Node | string | null | false | undefined;
function h(tag: string, attrs: Record<string, string> = {}, ...kids: Kid[]): HTMLElement {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const k of kids) if (k) el.append(k);
  return el;
}
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Text with every occurrence of q marked. */
function marked(text: string, q: string): DocumentFragment {
  const f = document.createDocumentFragment();
  if (!q) {
    f.append(text);
    return f;
  }
  let last = 0;
  for (const m of text.matchAll(new RegExp(esc(q), "gi"))) {
    f.append(text.slice(last, m.index), h("mark", { class: "rg-mark" }, m[0]));
    last = (m.index ?? 0) + m[0].length;
  }
  f.append(text.slice(last));
  return f;
}
/** "`doze init` also picks…" → code-formatted backticks. */
function rich(text: string): DocumentFragment {
  const f = document.createDocumentFragment();
  for (const part of text.split(/(`[^`]+`)/))
    f.append(part.startsWith("`") ? h("code", { class: "rg-mono" }, part.slice(1, -1)) : part);
  return f;
}
const chip = (cls: string, text: string) => h("span", { class: `rg-chip ${cls}` }, text);
const why = (lead: string, rest?: Node | string) =>
  h("span", { class: "rg-why" }, h("b", {}, lead), rest ? " " : "", rest);
const tile = (bg: string, logo: string | null, letter: string) =>
  h(
    "div",
    { class: "rg-tile", style: `background: ${bg}`, "aria-hidden": "true" },
    logo ? h("img", { src: logo, alt: "" }) : letter,
  );
const snip = (cmd: string) =>
  h(
    "div",
    { class: "rg-snip" },
    h("code", {}, h("i", {}, "$"), ` ${cmd}`),
    h("button", { class: "rg-copy", type: "button", "aria-label": `Copy ${cmd}`, "data-copy": cmd }, "Copy"),
  );
function hcl(lines: [string, string][], copy: boolean, label: string, text: string) {
  const pre = h("pre");
  for (const [k, v] of lines)
    pre.append(h("span", { class: "k" }, k), ` = [`, h("span", { class: "s" }, `"${v}"`), "]");
  return h(
    "div",
    { class: "rg-code" },
    h(
      "div",
      { class: "rg-code-top" },
      h("span", {}, label),
      copy && h("button", { class: "rg-copy", type: "button", "data-copy": text }, "Copy"),
    ),
    pre,
  );
}
/** A service block, coloured like the boards (keywords, strings, comments). */
function serviceCode(text: string): HTMLElement {
  const pre = h("pre");
  for (const [i, line] of text.split("\n").entries()) {
    if (i) pre.append("\n");
    const m = line.match(/^(\s*)(service)\s+("[^"]*")\s*\{$/);
    if (m) {
      pre.append(m[1], h("span", { class: "k" }, m[2]), " ", h("span", { class: "s" }, m[3]), " {");
      continue;
    }
    const c = line.match(/^(\s*)(#.*)$/);
    if (c) {
      pre.append(c[1], h("span", { class: "c" }, c[2]));
      continue;
    }
    const a = line.match(/^(\s*\w+\s*=\s*)("[^"]*")(\s*)(#.*)?$/);
    if (a) {
      pre.append(a[1], h("span", { class: "s" }, a[2]), a[3], a[4] ? h("span", { class: "c" }, a[4]) : "");
      continue;
    }
    pre.append(line);
  }
  return pre;
}
/** What `doze add <name>` writes for a name it doesn't know (detect.ServiceBlock). */
function downloadBlock(name: string, port: number) {
  return [
    `service "${name}" {`,
    "  # fetched once, pinned in doze.lock by its checksum, and run from the archive",
    `  download = "https://example.com/${name}-darwin-arm64.tar.gz" # fill this in`,
    `  run      = "./${name} --port $PORT"`,
    ...(port ? [`  port = ${port}`] : []),
    "}",
  ].join("\n");
}

// ---- matching
const norm = (s: string) => s.toLowerCase().trim();
function lev(a: string, b: string) {
  const d = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = d[0];
    d[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const t = d[j];
      d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = t;
    }
  }
  return d[b.length];
}

function search(ix: Index, raw: string): Hit[] {
  const q = norm(raw);
  const hits: Hit[] = [];
  const extHits: string[] = [];

  for (const e of ix.extensions) {
    const alias = e.aliases.find((a) => norm(a) === q);
    let score = 0;
    let reason: HTMLElement | null = null;
    if (norm(e.name) === q) {
      score = 100;
      reason = why("Matched the name.", `The CREATE EXTENSION name is ${e.name}.`);
    } else if (alias) {
      score = 95;
      reason = why(`Matched the alias ${alias}.`, `The CREATE EXTENSION name is ${e.name}; doze takes either.`);
    } else if (norm(e.title) === q) {
      score = 95;
      reason = why("Matched the project name.", `${e.title} is written ${e.name} in doze.hcl.`);
    } else {
      const partAlias = e.aliases.find((a) => norm(a).includes(q) && q.length >= 3);
      const inName = q.length >= 3 && (norm(e.name).includes(q) || norm(e.title).includes(q));
      const inWhat = q.length >= 3 && norm(e.what).includes(q);
      if (partAlias || inName || inWhat) {
        score = partAlias || inName ? 60 : 40;
        reason = h(
          "span",
          { class: "rg-why" },
          h(
            "b",
            {},
            partAlias ? `Matched the alias ${partAlias}` : inName ? "Matched the name" : "Matched the description",
          ),
          partAlias && inWhat ? " and the description." : ".",
        );
      }
    }
    if (!score || !reason) continue;
    extHits.push(e.name);
    const hcltext = `extensions = ["${e.name}"]`;
    hits.push({
      kind: "exts",
      score,
      el: h(
        "article",
        { class: "rg-panel rs-res" },
        tile("#336791", null, "P"),
        h(
          "div",
          { class: "rs-main" },
          h(
            "span",
            { class: "rs-crumb" },
            h("a", { href: "/registry/doze/postgres/" }, "postgres"),
            " › ",
            h("a", { href: "/registry/extensions/" }, "extensions"),
            ` › ${e.name}`,
          ),
          h(
            "div",
            { class: "rs-line" },
            h(
              "a",
              {
                class: "rg-name rg-mono",
                href: `/registry/doze/postgres/extensions/${e.name}/`,
                style: "font-size: 17px",
              },
              e.name,
            ),
            chip("info", "Coming in postgres 0.3"),
            chip("line", e.pg.length === 1 ? `Postgres ${e.pg[0]} only` : e.licence),
          ),
          h(
            "p",
            { class: "rg-p" },
            marked(
              `${e.what}. Built for ${e.majors.replace("PG", "Postgres")} at ${e.version}; ${e.preloads ? "preloaded" : "no preload"}.`,
              q,
            ),
          ),
          reason,
        ),
        h(
          "div",
          { class: "rs-meta" },
          hcl([["extensions", e.name]], true, "doze.hcl", hcltext),
          h("span", { class: "rg-small" }, "inside a ", h("code", { class: "rg-mono" }, "module postgres"), " block"),
        ),
      ),
    });
  }

  for (const m of ix.modules) {
    const alias = m.aliases.find((a) => norm(a.term) === q);
    let score = 0;
    let reason: HTMLElement | null = null;
    if (norm(m.name) === q || norm(m.title) === q) {
      score = 100;
      reason = why("Matched the name.");
    } else if (alias) {
      score = 90;
      reason = why(`Matched the alias ${alias.term}.`, rich(alias.why));
    } else if (q.length >= 2 && (norm(m.name).includes(q) || norm(m.title).includes(q))) {
      score = 70;
      reason = why("Matched the name.");
    } else if (q.length >= 3 && norm(m.text).includes(q)) {
      score = 45;
      reason = why("Matched the description.");
    } else if (m.name === "postgres" && extHits.length) {
      score = 30;
      reason = why(
        "Has the extension.",
        `${extHits.join(", ")} ${extHits.length === 1 ? "is one" : `are ${extHits.length}`} of postgres's ${ix.counts.extensions} catalog extensions.`,
      );
    }
    if (!score || !reason) continue;
    const showText = score !== 30;
    hits.push({
      kind: "mods",
      score,
      el: h(
        "article",
        { class: "rg-panel rs-res" },
        tile(m.tile, m.logo, m.title[0]),
        h(
          "div",
          { class: "rs-main" },
          h(
            "div",
            { class: "rs-line" },
            h("a", { class: "rg-name", href: m.href }, m.title),
            h("span", { class: "rg-small rg-mono" }, m.id),
            !showText && chip("off", "Official"),
            !showText && chip("ok", "Signed"),
          ),
          showText &&
            h(
              "div",
              { class: "rs-line", style: "gap: 6px; margin-top: -2px" },
              chip("off", "Official"),
              chip("ok", "Signed"),
            ),
          showText && h("p", { class: "rg-p" }, marked(m.text, q)),
          reason,
        ),
        h(
          "div",
          { class: "rs-meta" },
          snip(`doze add ${m.name}`),
          showText && h("span", { class: "rg-small" }, m.meta),
        ),
      ),
    });
  }

  for (const t of ix.tools) {
    const alias = t.aliases.find((a) => norm(a) === q);
    let score = 0;
    let lead = "";
    if (norm(t.name) === q || norm(t.title) === q) {
      score = 85;
      lead = "Matched the tool.";
    } else if (alias) {
      score = 80;
      lead = `Matched the alias ${alias}.`;
    } else if (q.length >= 3 && (norm(t.name).includes(q) || norm(t.title).includes(q))) {
      score = 60;
      lead = "Matched the tool.";
    } else if (q.length >= 3 && norm(t.tagline).includes(q)) {
      score = 35;
      lead = "Matched the description.";
    }
    if (!score) continue;
    hits.push({
      kind: "byo",
      score,
      el: h(
        "article",
        { class: "rg-panel rs-res" },
        h("div", { class: "rg-tile", style: "background: #4A3D55", "aria-hidden": "true" }, t.name[0].toUpperCase()),
        h(
          "div",
          { class: "rs-main" },
          h(
            "div",
            { class: "rs-line" },
            h("a", { class: "rg-name rg-mono", href: t.href, style: "font-size: 17px" }, t.name),
            chip("dim", "Not signed by doze"),
          ),
          h("p", { class: "rg-p" }, marked(`${t.tagline}. ${t.blurb}.`, q)),
          why(lead, "Not a module: doze add writes a service block that runs it, with a name, a port, sleep and wake."),
        ),
        h("div", { class: "rs-meta" }, snip(`doze add ${t.name}`), h("span", { class: "rg-small" }, `port ${t.port}`)),
      ),
    });
  }

  if (q.length >= 2) {
    const wordRe = new RegExp(`(^|\\s)${esc(q)}`);
    for (const d of ix.docs) {
      const inTitle = norm(d.title).includes(q);
      const inDesc = norm(d.description).includes(q);
      const heading = d.headings.find((x) => norm(x).includes(q));
      const inBody = wordRe.test(d.words);
      if (!inTitle && !inDesc && !heading && !inBody) continue;
      hits.push({
        kind: "docs",
        score: inTitle ? 50 : inDesc ? 30 : heading ? 20 : 10,
        el: h(
          "a",
          { class: "rs-doc", href: d.href },
          h("span", { class: "rs-crumb" }, d.crumb),
          h("b", { style: "font-size: 15.5px" }, marked(d.title, q)),
          h(
            "span",
            { class: "rg-small", style: "color: #4A3D55" },
            marked(d.description || (heading ? `Section: ${heading}` : ""), q),
            !inTitle && !inDesc && heading && d.description ? h("span", {}, ` Section: `, marked(heading, q)) : "",
          ),
        ),
      });
    }
  }
  // Docs: pages that name it in a title, summary or heading (at most five); pages
  // that only mention it in passing fill in up to three.
  const docs = hits.filter((x) => x.kind === "docs").sort((a, b) => b.score - a.score);
  const strong = docs.filter((x) => x.score >= 20).slice(0, 5);
  const keep = new Set([...strong, ...docs.filter((x) => x.score < 20).slice(0, Math.max(0, 3 - strong.length))]);
  return hits.filter((x) => x.kind !== "docs" || keep.has(x));
}

// ---- drawing
const groupName = { mods: "Modules", exts: "Postgres extensions", byo: "Bring your own", docs: "Docs" } as const;

function notInCatalog(q: string, n: number): HTMLElement | null {
  const known = byHand[q];
  if (!known) return null;
  const hand = `service "${q}" {\n  run  = "${known.run}"\n  port = ${known.port}\n}`;
  return h(
    "section",
    { class: "rs-group", "aria-labelledby": "g-nic" },
    h("header", {}, h("h2", { id: "g-nic" }, "Not in the catalog")),
    h(
      "article",
      { class: "rg-panel rs-byo" },
      h(
        "div",
        { class: "rs-line", style: "gap: 10px" },
        h("b", { class: "rg-mono", style: "font-size: 16px" }, known.bin),
        h("span", { class: "rg-small" }, known.what),
        chip("dim", "Not signed by doze"),
      ),
      h(
        "span",
        { class: "rg-small", style: "color: #4A3D55" },
        `${q} isn't a module and isn't one of the ${n} bring-your-own tools, so it isn't counted above. You can still run it as a service.`,
      ),
      h(
        "div",
        { style: "display: grid; grid-template-columns: minmax(0,1fr); gap: 16px" },
        h(
          "div",
          { class: "rs-main" },
          h(
            "span",
            { class: "rg-small" },
            h(
              "b",
              { style: "color: #140C1B" },
              "What ",
              h("code", { class: "rg-mono" }, `doze add ${q}`),
              " writes today:",
            ),
            " nothing is known, so a download to fill in.",
          ),
          h(
            "div",
            { class: "rg-code" },
            h("div", { class: "rg-code-top" }, h("span", {}, "doze.hcl, a placeholder to fill in")),
            serviceCode(downloadBlock(q, 0)),
          ),
        ),
        h(
          "div",
          { class: "rs-main" },
          h(
            "span",
            { class: "rg-small" },
            h("b", { style: "color: #140C1B" }, "Or write it by hand"),
            ` to run the ${known.bin} you installed:`,
          ),
          h(
            "div",
            { class: "rg-code" },
            h(
              "div",
              { class: "rg-code-top" },
              h("span", {}, "doze.hcl, by hand"),
              h("button", { class: "rg-copy", type: "button", "data-copy": hand }, "Copy"),
            ),
            serviceCode(hand),
          ),
        ),
      ),
      h(
        "p",
        { class: "rg-small", style: "margin: 0" },
        "doze still gives it a ",
        h("code", { class: "rg-mono" }, ".doze"),
        " name, a port, sleep and wake, and logs. ",
        known.swap
          ? h(
              "span",
              {},
              "Most apps never notice the swap to ",
              h("a", { href: known.swap.href }, known.swap.name),
              ", which is signed and pinned. ",
            )
          : "",
        h("a", { href: "/registry/tools/" }, "How bring-your-own works"),
      ),
    ),
  );
}

function nothing(ix: Index, raw: string) {
  const q = raw.trim();
  const name =
    norm(q)
      .replace(/[^a-z0-9_.-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "my-service";
  for (const el of document.querySelectorAll("[data-rs-q]")) el.textContent = q;
  // near spellings among everything with a name
  const names = [
    ...ix.modules.flatMap((m) => [m.name, ...m.aliases.map((a) => a.term)]),
    ...ix.extensions.flatMap((e) => [e.name, ...e.aliases]),
    ...ix.tools.flatMap((t) => [t.name, ...t.aliases]),
  ];
  const near = [
    ...new Set(
      names.filter(
        (n) => Math.abs(n.length - name.length) <= 2 && lev(n, name) <= Math.max(1, Math.floor(name.length / 4)),
      ),
    ),
  ].slice(0, 4);
  const note = document.querySelector("[data-rs-near]");
  if (note) {
    note.replaceChildren(h("b", { style: "color: #140C1B" }, `Closest matches: ${near.length ? "" : "none."}`));
    near.forEach((n, i) => {
      note.append(i ? ", " : "", h("a", { href: `/registry/search/?q=${encodeURIComponent(n)}` }, n));
    });
    const extra = nearNotes[name];
    if (extra) {
      const [before, after] = extra.split("Kvrocks");
      note.append(" ", before, h("a", { href: "/registry/doze/kvrocks/" }, "Kvrocks"), after);
    } else if (!near.length) note.append(" No near spelling of a module, extension or tool.");
  }
  const port = ports[name] ?? 0;
  const cmd = `doze add ${name}${port ? ` --port ${port}` : ""}`;
  const term = document.querySelector("[data-rs-term]");
  term?.replaceChildren(
    h("span", { class: "p" }, "$"),
    ` ${cmd}\n`,
    h(
      "span",
      { class: "c" },
      `→ ${name} is not a doze module — adding it as a service\n  nothing found on this machine — the block is a download to fill in\n  other ways: --as installed · --as container · --as download`,
    ),
  );
  document.querySelector("[data-rs-copy-add]")?.setAttribute("data-copy", cmd);
  document.querySelector("[data-rs-block]")?.replaceWith(serviceCode(downloadBlock(name, port)));
  const runline = document.querySelector("[data-rs-runline]");
  runline?.replaceChildren(
    `A placeholder: doze doesn't know ${q}'s flags. Change it to the real start command, in the foreground${runHints[name] ? ` (${runHints[name]})` : ""}.`,
  );
  const portline = document.querySelector<HTMLElement>("[data-rs-portline]");
  if (portline) portline.hidden = !port;
  const cont = document.querySelector("[data-rs-container]");
  cont?.replaceChildren(
    "Writes ",
    h("code", { class: "bare" }, `run = "docker run --rm -p $HOST:$PORT:${port || "<its port>"} ${name}"`),
    " instead, if you have Docker.",
  );
}

async function main() {
  const raw = new URLSearchParams(location.search).get("q")?.trim() ?? "";
  const input = document.querySelector<HTMLInputElement>("#rb-q");
  if (input && raw) input.value = raw;
  if (!raw) return;
  document.title = `${raw} · Registry search · doze`;
  const ix: Index = await (await fetch("/registry/search.json")).json();
  const hits = search(ix, raw);
  document.querySelector<HTMLElement>("[data-rs-empty]")!.hidden = true;
  if (!hits.length) {
    nothing(ix, raw);
    document.querySelector<HTMLElement>("[data-rs-none]")!.hidden = false;
    return;
  }
  for (const el of document.querySelectorAll("[data-rs-q]")) el.textContent = raw;
  const box = document.querySelector<HTMLElement>("[data-rs-groups]")!;
  const kinds = (["mods", "exts", "byo", "docs"] as const)
    .map((k) => ({ k, hits: hits.filter((x) => x.kind === k).sort((a, b) => b.score - a.score) }))
    .filter((g) => g.hits.length)
    .sort((a, b) => b.hits[0].score - a.hits[0].score || (a.k === "docs" ? 1 : b.k === "docs" ? -1 : 0));
  for (const g of kinds) {
    box.append(
      h(
        "section",
        { class: "rs-group", "aria-labelledby": `g-${g.k}`, "data-rs-group": g.k },
        h("header", {}, h("h2", { id: `g-${g.k}` }, groupName[g.k]), h("span", {}, String(g.hits.length))),
        ...g.hits.map((x) => x.el),
      ),
    );
  }
  const nic = notInCatalog(norm(raw), ix.counts.tools);
  if (nic) box.append(nic);
  const total = document.querySelector("[data-rs-total]");
  if (total) total.textContent = `${hits.length} result${hits.length === 1 ? "" : "s"}`;
  for (const k of ["mods", "byo", "exts", "docs"] as const) {
    const n = hits.filter((x) => x.kind === k).length;
    const opt = document.querySelector<HTMLElement>(`[data-rs-kind-opt="${k}"]`);
    const box2 = document.querySelector<HTMLInputElement>(`[data-rs-kind="${k}"]`);
    const count = document.querySelector(`[data-rs-kind-n="${k}"]`);
    if (count) count.textContent = String(n);
    if (box2) {
      box2.disabled = !n;
      box2.checked = !!n;
    }
    if (opt) opt.style.color = n ? "" : "#6E5F79";
  }
  document.querySelector<HTMLElement>("[data-rs-results]")!.hidden = false;
}

document.addEventListener("change", (e) => {
  const t = e.target as HTMLInputElement;
  if (!t.matches("[data-rs-kind]")) return;
  const g = document.querySelector<HTMLElement>(`[data-rs-group="${t.dataset.rsKind}"]`);
  if (g) g.hidden = !t.checked;
});
const fb = document.querySelector<HTMLButtonElement>("[data-rs-filters-btn]");
fb?.addEventListener("click", () => {
  const f = document.getElementById("rs-facets");
  const open = !f?.classList.contains("open");
  f?.classList.toggle("open", open);
  fb.setAttribute("aria-expanded", String(open));
});

main();
