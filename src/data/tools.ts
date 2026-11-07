// Bring-your-own tools: not modules. `doze add <name>` writes a `service` block
// that runs your installed binary, a container, or a pinned download. The run
// lines, images and ports are copied from doze's internal/detect/render.go
// (knownServices) and the blocks below are rendered the way ServiceBlock and
// DownloadBlock render them; the binary names from cmd/doze/add.go (binaryOf).
// When doze's table changes, change this file.

export type Tool = {
  /** The name `doze add` takes, and the page slug: "mongo". */
  name: string;
  /** What people call it: "MongoDB". */
  title: string;
  /** Other words a search should find it by. */
  aliases: string[];
  /** One line, as in the table of tools. */
  tagline: string;
  /** The first sentence of the page's lead. */
  what: string;
  /** The executable doze looks for on the PATH. */
  binary: string;
  /** The run line for an installed binary ($HOST, $PORT, $DATA filled in at run time); absent when doze knows none. */
  run?: string;
  /** The container image doze uses. */
  image: string;
  /** The port inside the container. */
  cport: number;
  /** The conventional port. */
  port: number;
  /** Tile colour (the tools have no logos here). */
  tile: string;
  /** A signed module that does the same job, when there is one. */
  alt?: { module: string; initial: string; tile: string; heading: string; text: string; label: string };
  /** The ways doze add can bring it, in the order it tries them. */
  sources: ("installed" | "container" | "download")[];
  /** For catalog cards: "MongoDB, from mongod, mongo:7 or a download". */
  blurb: string;
};

const table: Omit<Tool, "sources" | "blurb">[] = [
  {
    name: "mongo",
    title: "MongoDB",
    aliases: ["mongodb", "mongod", "mongo"],
    tagline: "The document database",
    what: "The document database.",
    binary: "mongod",
    run: "mongod --dbpath $DATA --bind_ip $HOST --port $PORT",
    image: "mongo:7",
    cport: 27017,
    port: 27017,
    tile: "#3F7A3A",
    alt: {
      module: "ferret",
      initial: "F",
      tile: "#2F5F3A",
      heading: "Want MongoDB-compatible from the registry? FerretDB.",
      text: "Any Mongo client connects to it. It's FerretDB 2 over a private Postgres, signed and pinned like every module, with databases, collections, indexes and seeds declared in doze.hcl. Not every MongoDB feature is there; check yours.",
      label: "The ferret module",
    },
  },
  {
    name: "mailpit",
    title: "Mailpit",
    aliases: ["mailpit", "mailhog", "smtp", "email", "mail"],
    tagline: "Catches outgoing email; web inbox on the next port",
    what: "Catches the email your apps send, with a web inbox on the next port.",
    binary: "mailpit",
    run: "mailpit --smtp $HOST:$PORT --listen $HOST:$((PORT + 1)) --database $DATA/mail.db",
    image: "axllent/mailpit",
    cport: 1025,
    port: 1025,
    tile: "#2F62A8",
  },
  {
    name: "minio",
    title: "MinIO",
    aliases: ["minio", "s3", "object storage"],
    tagline: "S3-compatible object storage (doze AWS has S3 too)",
    what: "S3-compatible object storage.",
    binary: "minio",
    run: "minio server $DATA --address $HOST:$PORT --console-address $HOST:$((PORT + 1))",
    image: "minio/minio",
    cport: 9000,
    port: 9000,
    tile: "#B0283C",
    alt: {
      module: "aws",
      initial: "A",
      tile: "#0C1320",
      heading: "Want S3 from the registry? doze AWS.",
      text: "S3 with SQS, SNS, DynamoDB, Lambda and more behind one port, signed and pinned like every module, with buckets and queues declared in doze.hcl.",
      label: "The aws module",
    },
  },
  {
    name: "nats",
    title: "NATS",
    aliases: ["nats", "nats-server", "jetstream"],
    tagline: "Messaging and streams",
    what: "Messaging and streams.",
    binary: "nats-server",
    run: "nats-server -a $HOST -p $PORT -sd $DATA",
    image: "nats",
    cport: 4222,
    port: 4222,
    tile: "#27AAE1",
  },
  {
    name: "meilisearch",
    title: "Meilisearch",
    aliases: ["meilisearch", "meili", "search"],
    tagline: "Typo-tolerant search engine",
    what: "A typo-tolerant search engine.",
    binary: "meilisearch",
    run: "meilisearch --http-addr $HOST:$PORT --db-path $DATA",
    image: "getmeili/meilisearch",
    cport: 7700,
    port: 7700,
    tile: "#C4256B",
  },
  {
    name: "memcached",
    title: "Memcached",
    aliases: ["memcached", "memcache"],
    tagline: "The classic in-memory cache",
    what: "The classic in-memory cache.",
    binary: "memcached",
    run: "memcached -l $HOST -p $PORT",
    image: "memcached",
    cport: 11211,
    port: 11211,
    tile: "#3D6A7A",
    alt: {
      module: "valkey",
      initial: "V",
      tile: "#4C55C8",
      heading: "Want a cache from the registry? Valkey.",
      text: "Redis-compatible, signed and pinned like every module, with its memory limit and eviction policy declared in doze.hcl.",
      label: "The valkey module",
    },
  },
  {
    name: "rabbitmq",
    title: "RabbitMQ",
    aliases: ["rabbitmq", "rabbit", "amqp"],
    tagline: "AMQP message broker",
    what: "The AMQP message broker.",
    binary: "rabbitmq",
    image: "rabbitmq:3",
    cport: 5672,
    port: 5672,
    tile: "#C25A12",
  },
  {
    name: "opensearch",
    title: "OpenSearch",
    aliases: ["opensearch", "elasticsearch", "elastic"],
    tagline: "Search and log analytics",
    what: "Search and log analytics.",
    binary: "opensearch",
    image: "opensearchproject/opensearch",
    cport: 9200,
    port: 9200,
    tile: "#005E85",
  },
  {
    name: "clickhouse",
    title: "ClickHouse",
    aliases: ["clickhouse", "olap"],
    tagline: "Column-store analytics database",
    what: "A column-store analytics database.",
    binary: "clickhouse",
    image: "clickhouse/clickhouse-server",
    cport: 8123,
    port: 8123,
    tile: "#5B5410",
  },
];

export const tools: Tool[] = table.map((t) => ({
  ...t,
  sources: t.run ? ["installed", "container", "download"] : ["container", "download"],
  blurb: t.run ? `${t.title}, from ${t.binary}, ${t.image} or a download` : `${t.title}, from ${t.image} or a download`,
}));

export const getTool = (name: string) => tools.find((t) => t.name === name);

const q = (s: string) => JSON.stringify(s);

/** What `doze add <name>` writes when the binary is on the PATH (ServiceBlock with found set). */
export function installedBlock(t: Tool): string | null {
  if (!t.run) return null;
  return `service ${q(t.name)} {\n  run  = ${q(t.run)}\n  port = ${t.port}\n}`;
}

/** What it writes as a container (ServiceBlock with an image). */
export function containerBlock(t: Tool): string {
  return [
    `service ${q(t.name)} {`,
    "  # a container: a container is just a command, and `run` stays in the foreground",
    `  run  = ${q(`docker run --rm -p $HOST:$PORT:${t.cport} ${t.image}`)}`,
    `  port = ${t.port}`,
    "}",
  ].join("\n");
}

/** What `--as download` writes (DownloadBlock): the URL and run line are left to fill in. */
export function downloadBlock(t: Tool): string {
  return [
    `service ${q(t.name)} {`,
    "  # fetched once, pinned in doze.lock by its checksum, and run from the archive",
    `  download = "https://example.com/${t.name}-darwin-arm64.tar.gz" # fill this in`,
    `  run      = "./${t.name} --port $PORT"`,
    `  port     = ${t.port}`,
    "}",
  ].join("\n");
}

/** "mailpit · axllent/mailpit", or "container rabbitmq:3" when doze knows no run line. */
export const runsFrom = (t: Tool) => (t.run ? `${t.binary} · ${t.image}` : `container ${t.image}`);
