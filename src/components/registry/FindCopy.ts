// The registry's finding pages (catalog, search) need a few words per module the
// signed index doesn't carry: the card's one line, how the engine reads, the tile
// colour, and the aliases search answers to (with the reason it says). Facts
// (releases, dates, engines, platforms, needs-doze) come from src/lib/registry.ts.
import { look, type Module, registry } from "../../lib/registry";

export type ModuleCopy = {
  /** The card's one line. */
  blurb: string;
  /** The longer line search shows. */
  long: string;
  /** Tile ground behind a logo or initial. */
  tile: string;
  /** Aliases search answers to, each with the reason it says. */
  aliases: { term: string; why: string }[];
};

export const moduleCopy: Record<string, ModuleCopy> = {
  aws: {
    blurb: "doze AWS as one service: S3, SQS, DynamoDB, Lambda and 13 more on one endpoint, with its console.",
    long: "doze AWS as one service: S3, DynamoDB, SQS, SNS, Lambda, Step Functions, EventBridge, IAM, KMS, SSM, Secrets Manager, Kinesis, STS and more on one endpoint, with its console.",
    tile: "#6B4E16",
    aliases: [
      ...[
        "s3",
        "sqs",
        "sns",
        "dynamodb",
        "lambda",
        "step functions",
        "eventbridge",
        "iam",
        "kms",
        "ssm",
        "secrets manager",
        "kinesis",
        "sts",
      ].map((t) => ({
        term: t,
        why: `doze AWS serves ${
          t === "ssm" || t === "sts" || t === "iam" || t === "kms" || t === "sqs" || t === "sns"
            ? t.toUpperCase()
            : t
                .replace(/\b\w/g, (c) => c.toUpperCase())
                .replace("Dynamodb", "DynamoDB")
                .replace("Eventbridge", "EventBridge")
        } on the one endpoint, with the rest of the AWS services.`,
      })),
      { term: "localstack", why: "A local AWS emulator: the same job, one small Go binary." },
    ],
  },
  ferret: {
    blurb: "MongoDB-compatible: any Mongo client connects. FerretDB 2 over a private Postgres.",
    long: "A MongoDB-wire database: any Mongo client connects unchanged. FerretDB 2 over a private Postgres, with databases and collections declared in doze.hcl.",
    tile: "#2F5F3A",
    aliases: [
      { term: "mongodb", why: "Speaks the MongoDB wire protocol, so Mongo drivers and mongosh connect unchanged." },
      { term: "mongo", why: "Speaks the MongoDB wire protocol, so Mongo drivers and mongosh connect unchanged." },
    ],
  },
  kafka: {
    blurb: "doze Kafka: a Kafka-protocol broker in one Go binary. No JVM, no ZooKeeper, no KRaft.",
    long: "doze Kafka: a Kafka-protocol broker in one Go binary, with consumer groups, transactions, a schema registry and a console. No JVM, no ZooKeeper, no KRaft.",
    tile: "#3D2A0A",
    aliases: [
      { term: "redpanda", why: "Another single-binary Kafka-protocol broker: doze Kafka does the same job locally." },
      { term: "schema registry", why: "doze Kafka has a schema registry built in." },
    ],
  },
  kvrocks: {
    blurb: "The Redis protocol on RocksDB: durable, and the data lives on disk, not in RAM.",
    long: "The Redis API on RocksDB: durable, and the data stays on disk instead of in RAM.",
    tile: "#2B6E64",
    aliases: [],
  },
  mariadb: {
    blurb: "MySQL-compatible. Databases, users and grants declared in doze.hcl.",
    long: "MySQL-compatible: any MySQL client or driver connects. Databases, users and grants declared in doze.hcl.",
    tile: "#1F4F66",
    aliases: [
      { term: "mysql", why: "MariaDB speaks the MySQL protocol, so MySQL clients and drivers connect unchanged." },
    ],
  },
  postgres: {
    blurb: "Real Postgres, declared not scripted: roles, schemas, grants and extensions.",
    long: "Real Postgres, declared not scripted: roles, schemas, grants and extensions in doze.hcl, any Postgres 14 – 18 version.",
    tile: "#336791",
    aliases: [
      { term: "postgresql", why: "The module's display name." },
      { term: "pg", why: "Short for Postgres." },
      { term: "psql", why: "The Postgres shell connects to it as to any Postgres." },
    ],
  },
  temporal: {
    blurb: "A local Temporal dev server with its Web UI. One Go binary, SQLite store.",
    long: "A local Temporal dev server with its Web UI: one Go binary, a SQLite store, namespaces declared in doze.hcl.",
    tile: "#24242B",
    aliases: [{ term: "workflow", why: "Temporal runs durable workflows." }],
  },
  valkey: {
    blurb: "In-memory cache that speaks the Redis protocol: any redis client works.",
    long: "In-memory cache. The open-source fork of Redis; it speaks the Redis protocol, so any redis client works unchanged.",
    tile: "#4C55C8",
    aliases: [
      {
        term: "redis",
        why: "Redis-compatible fork, speaks the Redis protocol. `doze init` also picks Valkey when it finds go-redis, ioredis or a redis image in your project.",
      },
    ],
  },
};

const fallback = (m: Module): ModuleCopy => ({
  blurb: m.meta.tagline ?? "",
  long: m.meta.description ?? m.meta.tagline ?? "",
  tile: look[m.name]?.tile ?? "#4A3D55",
  aliases: [],
});
export const copyFor = (m: Module): ModuleCopy => moduleCopy[m.name] ?? fallback(m);

/** The card's "Runs" line: what engine (and how many versions) the newest release runs. */
export function runsLine(m: Module, long = true): string {
  const r = m.releases[0];
  const e = r?.engines ?? [];
  const range = e.length > 1 ? `${e[0]} – ${e[e.length - 1]}` : (e[0] ?? "");
  if (m.name === "aws") return long ? "itself: doze AWS is in the module" : "itself";
  if (m.name === "kafka") return long ? `itself · Kafka protocol ${range}` : `Kafka protocol ${range}`;
  const name = look[m.name]?.engine ?? m.meta.title ?? m.name;
  const binaries = registry.engines[m.meta.engine === "ferret" ? "ferretdb" : m.meta.engine];
  // engines whose versions are two-part majors (Temporal CLI 1.x) read as "1.x"
  const majors = binaries && binaries.majorParts === 2 && m.name === "temporal" ? e.map((x) => `${x}.x`) : e;
  const r2 = majors.length > 1 ? `${majors[0]} – ${majors[majors.length - 1]}` : (majors[0] ?? "");
  const count = long && m.name === "postgres" && binaries ? ` (${binaries.versions.length} versions)` : "";
  return `${name} ${r2}${count}`.trim();
}

/** "macOS arm64 · Linux x86_64, arm64" from the newest release's platforms. */
export function platformsLine(m: Module): string {
  const t = new Set((m.releases[0]?.platforms ?? []).map((p) => p.triple));
  const mac = t.has("aarch64-apple-darwin") ? "macOS arm64" : "";
  const linux = ["x86_64-unknown-linux-gnu", "aarch64-unknown-linux-gnu"]
    .filter((x) => t.has(x))
    .map((x) => x.split("-")[0].replace("aarch64", "arm64"));
  return [mac, linux.length ? `Linux ${linux.join(", ")}` : ""].filter(Boolean).join(" · ");
}

/** Short platform labels a module ships, for the platform facet. */
export const platformKeys = (m: Module) => (m.releases[0]?.platforms ?? []).map((p) => p.triple);

/** The catalog's category facet groups. */
export const categories = [
  { id: "database", label: "Databases", match: ["database"] },
  { id: "cache", label: "Caches", match: ["cache"] },
  { id: "queue", label: "Queues and workflows", match: ["queue", "workflow"] },
  { id: "cloud", label: "Cloud", match: ["cloud"] },
] as const;
export const categoryOf = (m: Module) =>
  categories.find((c) => (c.match as readonly string[]).includes(m.meta.category))?.id ?? "other";

export const moduleHref = (m: Module) => `/registry/${m.namespace}/${m.name}/`;
