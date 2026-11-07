// Postgres extensions by name: the catalog the extensions page, search and the
// catalog read. Copied from the RegistryExtensions design board (versions from
// doze-binaries' extension catalog, built and tested on a branch).
// TEMPORARY HOME: when postgres 0.3 ships, this catalog is published with the
// postgres module (its signed index carries the extensions it can fetch), and
// the site reads it from src/data/registry.json instead of this file.

/** One Postgres major's cell: a version, or a state. */
export type Cell =
  | { v: string; state: "coming" } // built and tested on a branch, ships with postgres 0.3
  | { v: string; state: "planned" } // planned line [to confirm], not built yet
  | { state: "none" } // not built
  | { state: "no" } // not possible: upstream doesn't support this Postgres
  | { state: "unverified" }; // unverified upstream

export type Use =
  | "Vectors / AI"
  | "Time series"
  | "Geo"
  | "Queues and jobs"
  | "Search"
  | "Analytics"
  | "Performance"
  | "Audit"
  | "Graph"
  | "Validation";

export type Licence = "PostgreSQL" | "Apache-2.0" | "BSD-3" | "MIT" | "GPL-2.0" | "AGPL-3.0";

type Base = {
  /** The name you write in doze.hcl: `extensions = ["vector"]`. */
  name: string;
  /** The upstream project's name, e.g. "pgvector". */
  title: string;
  /** Other names that resolve to this one. */
  aliases: string[];
  /** One line: what it's for. */
  what: string;
  /** Small line under the name in the matrix ("+ CLI", "ParadeDB"), if any. */
  sub?: string;
  wave: 1 | 2;
  /** PG 14, 15, 16, 17, 18. */
  cells: [Cell, Cell, Cell, Cell, Cell];
  /** "yes" is added to shared_preload_libraries; the others are as written on the board. */
  preload: "yes" | "no" | "bgw, off" | "optional";
  licence: Licence;
  use: Use;
};

/** Base plus the facts the catalog cards and search read, derived from the cells. */
export type Ext = Base & {
  /** Postgres majors with a build (coming or planned), e.g. [15, 16, 17, 18]. */
  pg: number[];
  /** "PG 14 – 18", "PG 18". */
  majors: string;
  /** Newest line: "0.8.7" (coming) or "planned 2.31 [to confirm]". */
  version: string;
  /** Whether doze adds it to shared_preload_libraries. */
  preloads: boolean;
  /** "PostgreSQL licence", "Apache-2.0"… */
  licenceLabel: string;
};

export const pgMajors = [14, 15, 16, 17, 18] as const;

const c = (v: string): Cell => ({ v, state: "coming" });
const p = (v: string): Cell => ({ v, state: "planned" });
const all = (f: (v: string) => Cell, v: string) => [f(v), f(v), f(v), f(v), f(v)] as Ext["cells"];
const NO: Cell = { state: "no" };
const UNV: Cell = { state: "unverified" };

const raw: Base[] = [
  // Wave 1: coming in postgres 0.3, built and tested on a branch.
  {
    name: "vector",
    title: "pgvector",
    aliases: ["pgvector"],
    sub: "pgvector",
    what: "Vector similarity search for embeddings (HNSW, IVFFlat)",
    wave: 1,
    cells: all(c, "0.8.7"),
    preload: "no",
    licence: "PostgreSQL",
    use: "Vectors / AI",
  },
  {
    name: "pg_cron",
    title: "pg_cron",
    aliases: ["cron"],
    what: "Cron-style jobs run inside the database",
    wave: 1,
    cells: all(c, "1.6.8"),
    preload: "yes",
    licence: "PostgreSQL",
    use: "Queues and jobs",
  },
  {
    name: "pg_partman",
    title: "pg_partman",
    aliases: ["partman"],
    what: "Time- and serial-based partition management",
    wave: 1,
    cells: all(c, "5.5.0"),
    preload: "bgw, off",
    licence: "PostgreSQL",
    use: "Time series",
  },
  {
    name: "pgmq",
    title: "pgmq",
    aliases: [],
    what: "Lightweight message queues, like SQS, in tables",
    wave: 1,
    cells: all(c, "1.13.1"),
    preload: "no",
    licence: "PostgreSQL",
    use: "Queues and jobs",
  },
  {
    name: "hypopg",
    title: "HypoPG",
    aliases: [],
    what: "Hypothetical indexes: see what an index would do",
    wave: 1,
    cells: all(c, "1.4.5"),
    preload: "no",
    licence: "PostgreSQL",
    use: "Performance",
  },
  {
    name: "pg_hint_plan",
    title: "pg_hint_plan",
    aliases: [],
    what: "Steer the planner with hints in SQL comments",
    wave: 1,
    cells: [c("1.4.5"), c("1.5.4"), c("1.6.3"), c("1.7.2"), c("1.8.1")],
    preload: "yes",
    licence: "BSD-3",
    use: "Performance",
  },
  {
    name: "pg_repack",
    title: "pg_repack",
    aliases: [],
    sub: "+ CLI",
    what: "Rebuild bloated tables and indexes online",
    wave: 1,
    cells: all(c, "1.5.3"),
    preload: "no",
    licence: "BSD-3",
    use: "Performance",
  },
  {
    name: "pgaudit",
    title: "pgAudit",
    aliases: [],
    what: "Session and object audit logging",
    wave: 1,
    cells: [c("1.6.3"), c("1.7.1"), c("16.1"), c("17.1"), c("18.0")],
    preload: "yes",
    licence: "PostgreSQL",
    use: "Audit",
  },
  {
    name: "pg_ivm",
    title: "pg_ivm",
    aliases: [],
    what: "Incrementally maintained materialized views",
    wave: 1,
    cells: all(c, "1.17"),
    preload: "yes",
    licence: "PostgreSQL",
    use: "Analytics",
  },
  {
    name: "pg_jsonschema",
    title: "pg_jsonschema",
    aliases: ["jsonschema"],
    what: "JSON Schema validation for json and jsonb",
    wave: 1,
    cells: all(c, "0.3.4"),
    preload: "no",
    licence: "Apache-2.0",
    use: "Validation",
  },
  // Wave 2: planned [to confirm], not in doze-binaries' catalog yet.
  {
    name: "postgis",
    title: "PostGIS",
    aliases: ["postgis_topology", "postgis_raster", "postgis_tiger_geocoder", "h3", "pgrouting"],
    sub: "+ h3 4.2, pgrouting 3.8",
    what: "Geographic objects, spatial indexes and functions",
    wave: 2,
    cells: all(p, "3.6"),
    preload: "no",
    licence: "GPL-2.0",
    use: "Geo",
  },
  {
    name: "timescaledb",
    title: "TimescaleDB",
    aliases: ["timescale"],
    sub: "timescale",
    what: "Hypertables and time_bucket (Apache-only build)",
    wave: 2,
    cells: [NO, p("2.31"), p("2.31"), p("2.31"), p("2.31")],
    preload: "yes",
    licence: "Apache-2.0",
    use: "Time series",
  },
  {
    name: "pg_search",
    title: "pg_search",
    aliases: ["paradedb", "bm25"],
    sub: "ParadeDB",
    what: "BM25 full-text search",
    wave: 2,
    cells: [NO, p("0.20"), p("0.20"), p("0.20"), p("0.20")],
    preload: "yes",
    licence: "AGPL-3.0",
    use: "Search",
  },
  {
    name: "pg_duckdb",
    title: "pg_duckdb",
    aliases: ["duckdb"],
    what: "DuckDB inside Postgres: analytics, Parquet, Iceberg",
    wave: 2,
    cells: all(p, "1.1"),
    preload: "yes",
    licence: "MIT",
    use: "Analytics",
  },
  {
    name: "vectorscale",
    title: "pgvectorscale",
    aliases: ["pgvectorscale"],
    sub: "pgvectorscale",
    what: "DiskANN indexes for pgvector at scale",
    wave: 2,
    cells: [UNV, UNV, UNV, UNV, p("0.9")],
    preload: "no",
    licence: "PostgreSQL",
    use: "Vectors / AI",
  },
  {
    name: "age",
    title: "Apache AGE",
    aliases: ["apache_age"],
    sub: "Apache AGE",
    what: "Graph database with openCypher queries",
    wave: 2,
    cells: [p("1.5"), p("1.5"), p("1.5"), p("1.6"), p("1.6")],
    preload: "optional",
    licence: "Apache-2.0",
    use: "Graph",
  },
];

export const extensions: Ext[] = raw.map((e) => {
  const pg = pgMajors.filter((_, i) => "v" in e.cells[i]);
  const last = [...e.cells].reverse().find((c): c is Extract<Cell, { v: string }> => "v" in c);
  const v = last?.v ?? "";
  return {
    ...e,
    pg: [...pg],
    majors: pg.length > 1 ? `PG ${pg[0]} – ${pg[pg.length - 1]}` : `PG ${pg[0]}`,
    version: last?.state === "planned" ? `planned ${v} [to confirm]` : v,
    preloads: e.preload === "yes",
    licenceLabel: e.licence === "PostgreSQL" ? "PostgreSQL licence" : e.licence,
  };
});

/** Facet order as on the board. */
export const uses: Use[] = [
  "Vectors / AI",
  "Time series",
  "Geo",
  "Queues and jobs",
  "Search",
  "Analytics",
  "Performance",
  "Audit",
  "Graph",
  "Validation",
];
export const licences: Licence[] = ["PostgreSQL", "Apache-2.0", "BSD-3", "MIT", "GPL-2.0", "AGPL-3.0"];

/** Contrib extensions: inside every Postgres doze runs, nothing to fetch or pin. */
export const contrib: { name: string; what: string }[] = [
  ["pg_trgm", "Trigram similarity and fast LIKE/ILIKE indexes"],
  ["uuid-ossp", "Functions that generate UUIDs"],
  ["hstore", "Key/value pairs in one column"],
  ["citext", "Case-insensitive text"],
  ["pgcrypto", "Hashing and encryption functions"],
  ["btree_gin", "B-tree behaviour in GIN indexes"],
  ["btree_gist", "B-tree behaviour in GiST indexes"],
  ["pg_stat_statements", "Statistics for every SQL statement run"],
  ["postgres_fdw", "Query tables on another Postgres server"],
  ["ltree", "Hierarchical tree-like labels"],
  ["unaccent", "Text search dictionary that removes accents"],
  ["fuzzystrmatch", "Levenshtein, soundex and metaphone"],
  ["tablefunc", "crosstab and other table functions"],
  ["intarray", "Functions and indexes for integer arrays"],
  ["cube", "Multi-dimensional cubes"],
  ["earthdistance", "Great-circle distances on the Earth"],
  ["dblink", "Connect to other Postgres databases"],
  ["amcheck", "Verify the integrity of indexes and tables"],
  ["bloom", "Bloom filter index access method"],
  ["pg_buffercache", "Inspect the shared buffer cache"],
  ["pg_prewarm", "Load relations into the buffer cache"],
  ["pageinspect", "Inspect database pages at a low level"],
  ["pgstattuple", "Tuple-level statistics"],
  ["pgrowlocks", "Show row locking information"],
  ["pg_visibility", "Inspect the visibility map"],
  ["pg_freespacemap", "Inspect the free space map"],
  ["pg_surgery", "Repair damaged relations"],
  ["file_fdw", "Query server files as tables"],
  ["isn", "International product numbering standards"],
  ["lo", "Large object maintenance"],
  ["seg", "Line segments and floating-point intervals"],
  ["intagg", "Integer aggregator and enumerator"],
  ["moddatetime", "Trigger that tracks last modification time"],
  ["autoinc", "Trigger for autoincrementing fields"],
  ["insert_username", "Trigger that records who changed a row"],
  ["refint", "Triggers for referential integrity"],
  ["tcn", "Trigger that notifies listeners of changes"],
  ["sslinfo", "Information about the client's SSL certificate"],
  ["tsm_system_rows", "TABLESAMPLE method that takes a row count"],
  ["tsm_system_time", "TABLESAMPLE method that takes a time limit"],
  ["dict_int", "Text search dictionary for integers"],
  ["dict_xsyn", "Text search dictionary for extended synonyms"],
  ["xml2", "XPath querying and XSLT"],
  ["plpgsql", "The PL/pgSQL procedural language"],
].map(([name, what]) => ({ name, what }));
