// Per-module copy for the module pages that the signed index doesn't carry:
// recipes, connect snippets, release one-liners, engine support dates. Postgres
// is the module the boards were drawn for (RegistryModule, RegistryVersions,
// RegistryEngines, RegistryReference, RegistryExtension); its copy is the boards'.
// Other modules get only what can be grounded: their meta.yaml (describe.go),
// doze-modules history and design/release-dates.txt. A module with no entry
// here still gets every page, built from the index alone.
//
// Code snippets that aren't HCL are stored as HTML with the page's own colour
// classes (k = keyword, s = string, c = comment, p = prompt).

export type Recipe = {
  title: string;
  /** Small link or chip beside the title. */
  aside?: { href: string; text: string } | { chip: string };
  body: string; // HTML
  link?: { href: string; text: string };
  blocks: { label: string; code: string; aria: string; lang?: "hcl" | "shell" }[];
};

export type ModuleExtras = {
  /** Under "Start". */
  startLede?: string;
  /** Step 2: hand your app the URL. */
  app?: { code: string; after: string };
  /** Step 3: connect from code; tabs switch the panel. */
  connect?: { tabs: { id: string; label: string; html: string; copy: string }[]; summary: string };
  recipes?: { lede: string; items: Recipe[] };
  /** Show the extensions preview (postgres). */
  extensions?: boolean;
  does?: { icon: string; title: string; body: string }[];
  /** Quality line about conformance, when one is claimed by the boards. */
  conformance?: string;
  /** A coming release the boards show beside the index (postgres 0.3). */
  coming?: { version: string; short: string; doze: string; engines: string[]; what: string; note: string };
  /** One line per release: what changed (from doze-modules history). */
  notes?: Record<string, string>;
  /** Fuller notes for the release page: a lead line and bullets. */
  releaseNotes?: Record<string, { lead?: string; items: string[] }>;
  /** Builds on GitHub that the signed index never listed. */
  notInIndex?: { versions: string; what: string }[];
  /** Engine label when look.engine doesn't apply (kafka's protocol profiles). */
  engineLabel?: string;
  engines?: {
    lede?: string;
    /** Chip per major: "Supported upstream until …". */
    support?: Record<string, string>;
    /** Minors that were never tagged upstream, per major. */
    gaps?: Record<string, { v: string; note: string }[]>;
    /** A major past end of life, with its stages. */
    eol?: {
      major: string;
      chip: string;
      date: string;
      stages: { when: string; title: string; body: string; on?: boolean }[];
    };
    sourceNote?: string;
    /** "Pin a major, or pin exactly", with the lock lines it writes (real doze-binaries hashes). */
    pin?: { major: string; exact: string; lede: string; lock: string; after: string };
    matrixLede?: string;
    short?: string; // "PG" in "PG 14"
  };
  reference?: {
    /** Extra sentence after a block's own description. */
    blurbs?: Record<string, string>;
    /** Release every argument appeared in (derived from doze-modules history). */
    since?: string;
    /** Notes inside an argument's description. */
    argNotes?: Record<string, string>;
    /** A side panel inside a block group. */
    panels?: Record<string, { code: string; note: string }>;
    argsBlurb?: string;
  };
};

const pgUrl = "postgres://postgres@127.0.0.1:5432/postgres?sslmode=disable";
const icon = (d: string) =>
  `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A85A0C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const mono = (s: string) => `<code class="rm-ic">${s}</code>`;

export const extras: Record<string, ModuleExtras> = {
  postgres: {
    startLede: "Three lines in doze.hcl give you a real Postgres. Nothing starts until something connects.",
    app: {
      code: 'app "orders" {\n  run = "go run ./services/orders"\n  env = { DATABASE_URL = module.postgres.url }\n}',
      after: `Your app sees <code class="rm-url">${pgUrl}</code>. The database is named after the instance. ${mono("doze env")} prints it for tools outside doze.hcl.`,
    },
    connect: {
      tabs: [
        {
          id: "go",
          label: "Go · pgx",
          copy: "Copy the Go example",
          html: `<span class="rm-k">import</span> (
  <span class="rm-s">"context"</span>
  <span class="rm-s">"os"</span>

  <span class="rm-s">"github.com/jackc/pgx/v5/pgxpool"</span>
)

<span class="rm-k">func</span> open(ctx context.Context) (*pgxpool.Pool, <span class="rm-k">error</span>) {
  <span class="rm-c">// The first connection wakes Postgres; it can take a moment.</span>
  <span class="rm-k">return</span> pgxpool.New(ctx, os.Getenv(<span class="rm-s">"DATABASE_URL"</span>))
}`,
        },
        {
          id: "node",
          label: "Node · pg",
          copy: "Copy the Node example",
          html: `<span class="rm-k">import</span> pg <span class="rm-k">from</span> <span class="rm-s">"pg"</span>;

<span class="rm-c">// The first connection wakes Postgres; it can take a moment.</span>
<span class="rm-k">export const</span> pool = <span class="rm-k">new</span> pg.Pool({ connectionString: process.env.DATABASE_URL });`,
        },
        {
          id: "python",
          label: "Python · psycopg",
          copy: "Copy the Python example",
          html: `<span class="rm-k">import</span> os
<span class="rm-k">import</span> psycopg

<span class="rm-c"># The first connection wakes Postgres; it can take a moment.</span>
conn = psycopg.connect(os.environ[<span class="rm-s">"DATABASE_URL"</span>])`,
        },
        {
          id: "psql",
          label: "psql",
          copy: "Copy the psql command",
          html: `<span class="rm-p">$</span> psql <span class="rm-s">"$(doze url postgres)"</span>`,
        },
      ],
      summary: `Node: <code class="rm-ic2">new pg.Pool({ connectionString: process.env.DATABASE_URL })</code> · Python: <code class="rm-ic2">psycopg.connect(os.environ["DATABASE_URL"])</code> · psql: <code class="rm-ic2">psql "$(doze url postgres)"</code>`,
    },
    recipes: {
      lede: "The setups people write most, each complete. Paste one over the block above.",
      items: [
        {
          title: "A role and a schema per service",
          aside: { href: "/examples/", text: "From our example project, Larder" },
          body: "Each service connects as itself and can touch only its own tables. The schema shares the role's name, so the default search_path finds it.",
          blocks: [
            {
              label: "doze.hcl",
              aria: "Copy recipe: a role and a schema per service",
              code: 'module postgres "postgres" {\n  version = 18\n\n  role "orders"   { password = "orders" }\n  role "payments" { password = "payments" }\n\n  schema "orders"   { owner = "orders" }\n  schema "payments" { owner = "payments" }\n}',
            },
          ],
        },
        {
          title: "Vectors with pgvector",
          aside: { chip: "Coming in postgres 0.3" },
          body: "Name the extension; doze fetches the build for your Postgres major and platform, pins it in doze.lock and runs CREATE EXTENSION.",
          link: {
            href: "/registry/doze/postgres/extensions/vector/",
            text: "vector: versions, platforms, how to query",
          },
          blocks: [
            {
              label: "doze.hcl",
              aria: "Copy recipe: vectors with pgvector",
              code: 'module postgres "postgres" {\n  version    = 18\n  extensions = ["vector"]\n}',
            },
          ],
        },
        {
          title: "Pin an exact minor",
          body: `${mono("18")} takes the newest 18.x at first use (today {newest18}) and then never moves. Quote a version with a dot: as a number, 17.10 would read as 17.1.`,
          link: { href: "/registry/doze/postgres/engines/", text: "All {builds} Postgres builds" },
          blocks: [
            {
              label: "doze.hcl",
              aria: "Copy recipe: pin an exact minor",
              code: 'module postgres "postgres" {\n  version = "18.4"\n}',
            },
          ],
        },
        {
          title: "A throwaway database for tests",
          body: "A second instance on its own port. Reset wipes its rows; the next connection brings your roles and schemas back. Parallel workers each create and drop their own database inside it.",
          blocks: [
            {
              label: "doze.hcl",
              aria: "Copy recipe: a throwaway database for tests",
              code: 'module postgres "test" {\n  version = 18\n  port    = 5433\n  sleep   = "30s"\n}',
            },
            {
              label: "terminal",
              aria: "Copy the test commands",
              lang: "shell",
              code: "$ doze reset test --yes\n$ doze run -- go test ./...",
            },
          ],
        },
      ],
    },
    extensions: true,
    does: [
      {
        icon: icon(
          '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9 7 7M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1"/>',
        ),
        title: "Wakes on connect",
        body: "doze holds port 5432. The first connection wakes Postgres and is handed over once it is ready.",
      },
      {
        icon: icon('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
        title: "Sleeps after 2 minutes",
        body: `With no connection open for 2m it goes to sleep; the data stays on disk. ${mono('sleep = "never"')} keeps it on.`,
      },
      {
        icon: icon('<path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 3v5h-5"/>'),
        title: "Converges what you declare",
        body: "Roles, schemas, grants and extensions: creates what is new, changes what changed, drops what you removed.",
      },
      {
        icon: icon('<path d="M5 12h14M13 6l6 6-6 6"/>'),
        title: "Moves your data between majors",
        body: `Change 17 to 18, then ${mono("doze migrate postgres")}: dump, fresh cluster, restore. The old data is kept beside it.`,
      },
      {
        icon: icon('<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>'),
        title: "Tuned for a laptop",
        body: `fsync off, 16MB shared_buffers, 50 connections. Set ${mono("fsync = true")} when you need it crash-safe.`,
      },
      {
        icon: icon('<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'),
        title: "Same bytes on every machine",
        body: "The module and the Postgres build are pinned by sha256 in doze.lock. Commit it.",
      },
    ],
    conformance:
      "Every argument on the Reference tab converged into a running server, once per major, before a release is signed.",
    coming: {
      version: "0.3.0",
      short: "0.3",
      doze: "0.2.0",
      engines: ["14", "15", "16", "17", "18"],
      what: "Extensions by name. Built on a branch, not released.",
      note: '<code class="rv-mono" style="font-size: 13px">extensions = ["vector", "pg_cron"]</code>, each bundle pinned in doze.lock. <a href="/registry/doze/postgres/extensions/">Preview the catalog</a>',
    },
    notes: {
      "0.2.4": "A console: an Activity tab (sessions, their queries, Cancel or Terminate) and a databases table.",
      "0.2.2":
        'The readiness check connects as <code class="rv-mono" style="font-size: 13px; white-space: nowrap">-U postgres</code>, not your OS user.',
      "0.2.1": "The first release in the signed index (protocol 1).",
    },
    releaseNotes: {
      "0.2.4": {
        lead: "A console for Postgres: who is connected, what they are running, and a way to stop it.",
        items: [
          "An Activity tab: the counters, the sessions, the selected session's query, and Cancel or Terminate.",
          "A databases table on the overview. System databases are left out.",
        ],
      },
      "0.2.2": {
        items: ['The readiness check connects as <code class="rr-mono">-U postgres</code>, not your OS user.'],
      },
      "0.2.1": { items: ["The first postgres release in the signed index (protocol 1)."] },
    },
    notInIndex: [
      { versions: "0.1.0, 0.1.1", what: "27–28 Jun 2026. Built before protocol 1 and the signed index (2 Jul)." },
      { versions: "0.2.0", what: "2 Jul 2026. Replaced by 0.2.1 the same day, before it was listed. [why]" },
    ],
    engines: {
      short: "PG",
      support: { "18": "14 Nov 2030", "17": "8 Nov 2029", "16": "9 Nov 2028", "15": "11 Nov 2027" },
      gaps: { "18": [{ v: "18.5", note: "Upstream never tagged 18.5, so there is no 18.5 to build." }] },
      eol: {
        major: "14",
        chip: "Deprecated",
        date: "Upstream end of life 12 Nov 2026",
        stages: [
          {
            when: "12 Nov 2026",
            title: "End of life upstream",
            body: "The PostgreSQL project ships no more 14.x fixes. {newest} is the newest built.",
            on: true,
          },
          {
            when: "From [date]",
            title: "Deprecated in doze: new projects are warned",
            body: '<code class="re-mono">doze add postgres</code> and a fresh <code class="re-mono">version = 14</code> say so, and suggest 18.',
          },
          {
            when: "Forever",
            title: "Served to pinned projects",
            body: "doze keeps serving every 14.x a doze.lock names. doze-binaries is append-only.",
          },
        ],
      },
      sourceNote:
        'Upstream dates from the <a href="https://www.postgresql.org/support/versioning/">PostgreSQL versioning policy</a>. Five years of fixes per major.',
      pin: {
        major: "17",
        exact: "17.6",
        lede: "A bare major takes the newest minor the first time it resolves, then stays there: a new 17.12 never reaches a project already pinned to 17.11. Write the full version when you need to match production.",
        lock: `engines:
    postgres:
        "17":
            resolved: 17.11.0
            source: mirror
            hashes:
                aarch64-apple-darwin: sha256:1214c27cec0f357fbc570bc61788fde1cc918c2bced8b54e077ec990168c77f2
        "17.6":
            resolved: 17.6.0
            source: mirror
            hashes:
                aarch64-apple-darwin: sha256:8e80925b1568cc09d8a17448368b6a5e6d935c9817474c10ed7fb5aa77780fee`,
        after:
          "Each platform adds its own hash the first time it downloads, so a teammate on Linux adds a line under the same pin. Changing the version in doze.hcl adds a new entry; nothing else moves an engine pin.",
      },
    },
    reference: {
      since: "0.2.1",
      argsBlurb: "The database they describe is named after the instance.",
      blurbs: {
        role: 'With <code class="rf-ic">login = false</code>, a group role to hang grants on.',
        grant:
          'The label is the role that receives it: <code class="rf-ic">grant "orders" { privileges = ["ALL"], schema = "orders", objects = "tables" }</code>.',
      },
      argNotes: { extensions: 'Catalog names: <span class="rf-chip rf-info">coming in postgres 0.3</span>' },
      panels: {
        extension: {
          code: 'module postgres "postgres" {\n  version = 18\n  extension "vector" { version = "0.8.7" }\n}',
          note: '<span class="rf-chip rf-info">Coming in postgres 0.3</span><br>Catalog names such as <code class="rf-ic">vector</code> are fetched by doze from postgres 0.3. Today a name must ship with Postgres (contrib) or come with a <code class="rf-ic">source</code>.',
        },
      },
    },
  },
  ferret: {
    notes: {
      "0.2.2":
        'The readiness check connects as <code class="rv-mono" style="font-size: 13px; white-space: nowrap">-U postgres</code>, not your OS user.',
    },
    releaseNotes: {
      "0.2.2": {
        items: ['The readiness check connects as <code class="rr-mono">-U postgres</code>, not your OS user.'],
      },
    },
    notInIndex: [{ versions: "0.2.0", what: "2 Jul 2026. On GitHub, never listed in the signed index." }],
  },
  valkey: {
    notInIndex: [
      { versions: "0.1.0", what: "28 Jun 2026. Built before protocol 1 and the signed index (2 Jul)." },
      { versions: "0.2.0", what: "2 Jul 2026. On GitHub, never listed in the signed index." },
    ],
  },
  kvrocks: { notInIndex: [{ versions: "0.1.0, 0.2.0", what: "On GitHub, never listed in the signed index." }] },
  mariadb: { notInIndex: [{ versions: "0.2.0", what: "On GitHub, never listed in the signed index." }] },
  temporal: { notInIndex: [{ versions: "0.2.0", what: "On GitHub, never listed in the signed index." }] },
  kafka: { engineLabel: "Kafka protocol" },
};

export const extrasFor = (name: string): ModuleExtras => extras[name] ?? {};

/** The vector extension's page, as the RegistryExtension board draws it. Others are built from src/data/extensions.ts. */
export const extensionExtras: Record<
  string,
  {
    lede: string;
    upstream: { href: string; text: string };
    builtFrom?: { href: string; text: string };
    defaultLine?: string;
    bundles?: { major: string; rows: { triple: string; state: "built" | "none" }[] };
    query?: { intro: string; sql: string; langs: { label: string; aria: string; html: string }[] };
    related?: string[];
  }
> = {
  vector: {
    lede: 'Store embeddings next to the rows they describe and ask for the nearest ones: a <code class="rx-ic">vector</code> column type, exact search, and approximate search with HNSW and IVFFlat indexes, by L2, inner product or cosine distance.',
    upstream: { href: "https://github.com/pgvector/pgvector", text: "pgvector/pgvector" },
    builtFrom: { href: "https://github.com/pgvector/pgvector/tree/v0.8.7", text: "pgvector v0.8.7" },
    defaultLine: "0.8",
    bundles: {
      major: "18",
      rows: [
        { triple: "aarch64-apple-darwin", state: "built" },
        { triple: "x86_64-unknown-linux-gnu", state: "none" },
        { triple: "aarch64-unknown-linux-gnu", state: "none" },
      ],
    },
    query: {
      intro:
        'CREATE EXTENSION is done for you. Make a vector column, then order by distance: <code class="rx-ic2">&lt;-&gt;</code> is L2, <code class="rx-ic2">&lt;=&gt;</code> cosine, <code class="rx-ic2">&lt;#&gt;</code> inner product.',
      sql: `<span class="rx-k">create table</span> items (id bigserial primary key, embedding vector(3));
<span class="rx-k">create index on</span> items <span class="rx-k">using</span> hnsw (embedding vector_l2_ops);

<span class="rx-k">select</span> id <span class="rx-k">from</span> items <span class="rx-k">order by</span> embedding &lt;-&gt; <span class="rx-s">'[3,1,2]'</span> <span class="rx-k">limit</span> 5;`,
      langs: [
        {
          label: "Python · pgvector + psycopg",
          aria: "Copy the Python snippet",
          html: `<span class="rx-k">from</span> pgvector.psycopg <span class="rx-k">import</span> register_vector
<span class="rx-k">import</span> numpy <span class="rx-k">as</span> np, os, psycopg

conn = psycopg.connect(os.environ[<span class="rx-s">"DATABASE_URL"</span>])
register_vector(conn)
conn.execute(
  <span class="rx-s">"select id from items order by embedding &lt;-&gt; %s limit 5"</span>,
  (np.array([3, 1, 2]),))`,
        },
        {
          label: "Node · pgvector + pg",
          aria: "Copy the Node snippet",
          html: `<span class="rx-k">import</span> pg <span class="rx-k">from</span> <span class="rx-s">"pg"</span>;
<span class="rx-k">import</span> pgvector <span class="rx-k">from</span> <span class="rx-s">"pgvector/pg"</span>;

<span class="rx-k">const</span> client = <span class="rx-k">new</span> pg.Client(process.env.DATABASE_URL);
<span class="rx-k">await</span> client.connect();
<span class="rx-k">await</span> pgvector.registerTypes(client);
<span class="rx-k">await</span> client.query(
  <span class="rx-s">"select id from items order by embedding &lt;-&gt; $1 limit 5"</span>,
  [pgvector.toSql([3, 1, 2])]);`,
        },
        {
          label: "Go · pgvector-go + pgx",
          aria: "Copy the Go snippet",
          html: `<span class="rx-k">import</span> (
  <span class="rx-s">"github.com/pgvector/pgvector-go"</span>
  pgxvec <span class="rx-s">"github.com/pgvector/pgvector-go/pgx"</span>
)

pgxvec.RegisterTypes(ctx, conn)
rows, err := conn.Query(ctx,
  <span class="rx-s">"select id from items order by embedding &lt;-&gt; $1 limit 5"</span>,
  pgvector.NewVector([]<span class="rx-k">float32</span>{3, 1, 2}))`,
        },
      ],
    },
    related: ["vectorscale", "pg_search"],
  },
};
