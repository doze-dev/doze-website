# doze-dev.com: the full site, designed screen by screen

You are designing boards (pages) on a Design canvas for **doze-dev.com**, the
website of the doze family. The owner wants EVERY screen the site needs drawn
first, at commercial, top-notch quality, before any of it is built. Read this
whole brief before you write anything.

## The products (what is true)

- **doze**: a local-development tool. One `doze.hcl` describes a whole dev
  stack (databases, queues, AWS, your own services and tasks). It runs them as
  native processes, no Docker, no VM. Things **wake** when something connects
  and **sleep** when idle; data stays on disk. A desktop app (macOS, Wails) plus
  the CLI. Every service gets a `.doze` name (`gateway.larder.doze`) and your
  own domain over https if you want. Apache-2.0, no account, no telemetry.
  Install: `brew install --cask doze-dev/tap/doze` (app) or
  `brew install doze-dev/tap/doze` (CLI only), also mise, `go install`, a
  tarball. Apple silicon macOS and Linux (x86_64, arm64). No Intel Mac, no
  Windows (WSL2 works). Newest release **v0.1.1 (2 Jul 2026)**; the next is
  **[0.2.0]** (write it as `0.2` in examples; it is not out yet, say "next").
- **doze AWS**: a local AWS emulator, one small Go binary: S3, DynamoDB, SQS,
  SNS, Lambda (real host processes), Step Functions, EventBridge, IAM (real
  policy evaluation, "generate the policy your tests used"), KMS, SSM, Secrets
  Manager, Kinesis, STS and more (17 services), with a console at /_console.
  `doze add aws` or standalone.
- **doze Kafka**: a Kafka broker in one Go binary, no JVM/ZooKeeper/KRaft. Wire
  protocol Kafka 1–4, consumer groups, transactions, SASL/TLS, a schema
  registry built in, a console. `doze add kafka` or standalone.
- **The registry**: where doze gets its **modules** (signed plugins that run
  engines). See "The registry" below; it is the part that needs the most thought.
- **Examples**: `github.com/doze-dev/doze-examples`. The showcase is **Larder**,
  an online grocery service ("groceries at your door within the hour"): a
  monorepo split by domain. Go: identity, catalog, orders, payments, gateway.
  Python: fulfilment, recommendations. TypeScript: notifications, storefront
  (Vite + React). Shared: `postgres` (one server, a role + schema per service),
  `redis` (Valkey, Redis-compatible), `kafka` (topics users.signed-up,
  orders.placed, payments.settled, payments.failed), `aws` (buckets
  product-images, receipts; queue pick-lists with a DLQ), `mailpit` (email).
  Tasks: migrate-<service> per service, install-* (bun/uv), seed-catalog
  (manual). Use Larder everywhere a demo stack appears. NEVER "shop", "api",
  "web", "worker", "db", "cache", "cloud", "events" as instance names any more.

## Brand

- Night and a lamp. Marketing pages are dark: ground `#140C1B`, raised
  `#1A1022`/`#1E1328`, lines `#2E1F3A`/`#34233F`/`#4A3458`, text `#F4ECE4`,
  secondary `#C9BAD3`/`#D6C8DF`, dim `#9C8AAB`. Lamp amber `#F0A24B` (buttons:
  amber with ink `#2A1534`). doze AWS sky `#5BB8E8` on navy `#0C1320`. doze
  Kafka yellow `#FFD60A` on `#16150F`. Good `#8BE39B`, bad `#FF9AA8`.
- **Docs and the registry are daylight** (they are read and copied from):
  ground `#FFFAF4`, panels `#FFFFFF`, sunk `#FFF4E8`, lines `#EADFD3`/`#DCCFC2`,
  ink `#140C1B`, secondary `#4A3D55`, dim `#6E5F79`, links and accents in a
  darker amber `#A85A0C` (passes 4.5:1 on white; plain `#F0A24B` is for fills
  only). Status: good `#1D7A45` on `#E6F4EA`, warn `#8A5300` on `#FFF1D6`, bad
  `#B4233C` on `#FCE8EC`, info `#2F62D9` on `#E8EEFC`. Code blocks stay dark
  (`#1E1328` ground, `#F4ECE4` text, `#7F6C8E` prompts) with a Copy button.
- Type: **Bricolage Grotesque** 700/800 for headlines (tight tracking, -0.03em
  at display sizes), **Geist** for text, **JetBrains Mono** for code. Load them
  in `<helmet>` exactly as SiteHeader.dc.html does.
- Logos (uploaded, use verbatim): doze `/_blob/011c89d77e6c83d760300a6f93b9f3cb`,
  doze AWS `/_blob/41256a0dca71d1a229f31f249dc60fab`, doze Kafka
  `/_blob/db3a4ac64e41e22e53ca3c1594b33fca`. Real product screenshots already
  on the canvas (reuse; they show the OLD shop demo, so caption them neutrally
  or crop): app map `/_blob/f2be955545a79717a7a18ce777640195`, app tiles
  `/_blob/fed6afecf6252da163570107c1a0c7c3`, AWS wire
  `/_blob/8236daf36d4bf7a3349e823b4f17743b`, Kafka orders
  `/_blob/768e901f5c730fde039a1b5c597a54bf`. Where a Larder screenshot is
  needed and none exists, draw a clearly labelled frame "[screenshot: …]" with
  what it will show; never fake one.
- Voice: problem first, then the fix. Short, plain, exact. The sleep words
  only: wake, awake, dozing, asleep, sleep (never "reap", "idle timeout",
  "spin up"). Numbers over adjectives. **No invented customers, quotes, logos,
  download counts, star counts or benchmark numbers.** Unknowns stay in
  `[brackets]`. doze collects no telemetry, so the registry shows no download
  counts; say why where a reader would expect them.

## The canvas format (rules that bite)

Each board is one file `project/<Name>.dc.html`. Copy the skeleton of
`project/SiteHeader.dc.html` (head lines, `<x-dc>`, `<helmet>`, the
`<script type="text/x-dc" data-dc-script data-props='{"$preview":{...}}'>`
block with `class Component extends DCLogic { renderVals() { return {...}; } }`).
- Pages are fluid: root has no fixed px width; content in a
  `max-width: 1240px; margin: 0 auto; padding: 0 32px` container; grids with
  `repeat(auto-fit, minmax(…, 1fr))`; at phone width things stack. `$preview`
  width 1440 and height ≈ the page's real height.
- Start every page with `<dc-import name="SiteHeader" theme="dark|light"
  current="home|doze|aws|kafka|registry|examples|docs|download|changelog|none"
  hint-size="100%,72px"></dc-import>` and end with `<dc-import
  name="SiteFooter" theme="dark|light" hint-size="100%,420px"></dc-import>`.
  Never draw your own header or footer.
- Links between boards are relative file names (`href="Registry.dc.html"`).
  Real hrefs for external things.
- `{{hole}}` only looks up renderVals; no expressions. Repeats with
  `<sc-for list="{{rows}}" as="r">`, branches `<sc-if value="{{x}}">`. Prefer
  plain static markup: most boards are a state drawn, not a live widget.
- Quote every attribute, close every element, no emoji, inline stroke SVG
  icons (`aria-hidden="true"`). Real `<a href>`, `<button type="button">`,
  `<input>` with `<label>`. Text contrast ≥ 4.5:1 (check your greys). Touch
  targets ≥ 44px on phone.
- Put classes in `<helmet><style>`; put one-off layout in inline styles.
- No `<iframe>`, no `data:` URIs, no network except the Google Fonts link.

## Checking your work (required)

Render every board and look at it before you call it done:
`cd /private/tmp/claude-501/-Users-srini-Code-doze-dev/7b22fd62-a94d-4e3a-bd10-f71bb12a1385/scratchpad/web2 && bun preview.ts project/<Name>.dc.html`
writes `shots/<Name>.png` (full page, 1440 wide); add `--w=390` for phone.
Long pages: `bun crop.ts $PWD/shots/<Name>.png 2600` slices them into
readable parts. Look at the images (Read tool). Fix overlaps, clipped text,
orphans in headlines, weak contrast, empty-looking areas, misaligned grids.
Check every board at 1440 AND 390. `/_blob/` images render as striped boxes
locally; that's expected. Do NOT publish to the canvas; leave files in
`project/`. Do not edit files owned by another designer (listed below).

## Site map (one domain, doze-dev.com)

| Path | Board | Theme |
|---|---|---|
| / | Main | dark |
| /doze | Doze | dark |
| /aws | Aws | dark (sky accents) |
| /kafka | Kafka | dark (yellow accents) |
| /download | Download | dark |
| /examples | Examples (Larder) | dark |
| /changelog | Changelog | dark |
| /security | Security | dark |
| /brand | Brand | dark |
| /docs | DocsHome | light |
| /docs/doze/…, /docs/aws/…, /docs/kafka/… | DozeDocs, AwsDocs, KafkaDocs | light |
| /registry | Registry | light |
| /registry?q=redis | RegistrySearch | light |
| /registry?q=cassandra | RegistryNoResults | light |
| /registry?doze=0.1.1 | RegistryForYourDoze | light |
| /registry/extensions | RegistryExtensions | light |
| /registry/doze/postgres | RegistryModule | light |
| /registry/doze/postgres/versions | RegistryVersions | light |
| /registry/doze/postgres/0.2.4 | RegistryRelease | light |
| /registry/doze/postgres/0.2.1 | RegistryReleaseOld | light |
| /registry/doze/postgres/engines | RegistryEngines | light |
| /registry/doze/postgres/reference | RegistryReference | light |
| /registry/doze/postgres?doze=0.1.1 | RegistryTooOld | light |
| /registry/doze/postgres/extensions/vector | RegistryExtension | light |
| /registry/tools/mongodb | RegistryTool | light |
| /registry/doze | RegistryPublisher | light |
| /registry/trust | RegistryTrust | light |
| /registry/publish | RegistryPublish | light |
| any missing page | NotFound | dark |

`registry.doze-dev.com` serves only the signed files doze fetches
(`/doze/<module>/index.yaml`, `/doze/keys.json`, `/index.json`); a browser
there is sent to doze-dev.com/registry.

## The registry: the model to design from

Real data: `registry-data.json` (every module, release, engine major, platform,
sha256, the real signing key, config arguments; engine versions doze-binaries
builds) and `release-dates.txt`. Use them; do not invent releases or hashes.

What exists today:
- 8 modules, all in the one namespace `doze` (published by doze-dev, signed by
  one ed25519 key `Nu5y8mbjYv7XEtNFBXwPVl+C8SBteVApIROefBwGWjw=`): postgres,
  valkey, kvrocks, ferret (FerretDB, MongoDB-compatible), mariadb, temporal,
  kafka (doze Kafka), aws (doze AWS).
- Each **module release** has: version, plugin `protocol` (1), `engines` (the
  engine majors it can run, e.g. postgres 14–18, valkey 8–9, mariadb 11.x…),
  three platforms (aarch64-apple-darwin, aarch64-unknown-linux-gnu,
  x86_64-unknown-linux-gnu) each with url + sha256 + ed25519 signature, and an
  index-level signature over the whole index.
- **Oldest doze per release**: an optional `doze: "0.2"` field on each release.
  doze already honours it: releases needing a newer doze are skipped, and if
  none fits it says exactly: `postgres 17 needs doze 0.2 or newer; this doze
  is 0.1.1. Update doze (in the app: Settings › About), then run the command
  again`. A doze.lock written by a newer doze says: `module doze/postgres
  0.2.4 (pinned in doze.lock) needs doze 0.2 or newer; this doze is 0.1.1.
  Update doze (in the app: Settings › About); the lock was written by a newer
  doze`. No published release sets the field yet; boards show the designed
  values (e.g. postgres 0.2.4 → needs doze 0.2) and the grounding board says
  so. Today the field sits outside the signed part of the index; the design
  moves it inside.
- **Engine binaries** (doze-binaries): real Postgres 14.0–14.24, 15.0–15.19,
  16.0–16.15, 17.0–17.11, 18.0–18.4 and 18.6 (upstream never tagged 18.5),
  per platform. `version = 17` resolves to the newest 17.x at the moment it
  is first pinned (today 17.11) and then never moves on its own;
  `version = "17.6"` pins exactly. Postgres 14 reaches end of life upstream on
  12 Nov 2026; doze keeps serving every pinned 14.x forever.
- **doze.lock** pins, per project: each engine (`postgres "17": resolved
  17.11.0, hashes per platform`) and each module (`doze/postgres: version
  0.2.4, protocol 1, engines [14…18], hashes per platform`). Pinned + cached =
  offline. `doze modules upgrade` moves module pins on purpose; nothing else
  ever does.
- **Postgres extensions by name** (built on a branch, not released yet; show
  as "coming in postgres 0.3" where it matters): `extensions = ["vector",
  "pg_cron"]` or `extension "timescaledb" { version = "2.31" }`. Each bundle is
  per (extension, version, PG major, platform), pinned in doze.lock. Catalog:
  pgvector (vector) 14–18 no preload; pg_cron 14–18 preload; pg_partman 14–18
  (bgw preload); pgmq 14–18; hypopg 14–18; pg_hint_plan 14–18; pg_repack
  14–18 (+CLI); pgaudit 14–18 preload; pg_ivm 14–18 preload; pg_jsonschema
  14–18; then PostGIS (+h3, pgRouting) 14–18 GPL-2; TimescaleDB 15–18
  (Apache-only build: hypertables, time_bucket; no compression or continuous
  aggregates) preload; pg_search (ParadeDB, BM25) 15–18 AGPL-3 preload;
  pg_duckdb 14–18 MIT preload; pgvectorscale 18 only; Apache AGE 14–18.
  Contrib extensions (pg_trgm, uuid-ossp, hstore, citext, …) ship with
  Postgres and are listed apart. Aliases: pgvector → vector, timescale →
  timescaledb, postgis_topology etc.
- **Bring-your-own tools** (not modules; `doze add <name>` writes a
  `service` block that runs your installed binary, a container, or a pinned
  download): mongo, mailpit, minio, nats, meilisearch, memcached, rabbitmq,
  opensearch, clickhouse. doze gives them a name, a port, sleep and wake; a
  download is pinned by sha256 in doze.lock; they are not signed by doze.

What the design ADDS (each must be marked as new on the grounding board):
1. Oldest doze per release, signed, shown on every release, with a history
   ("needs doze 0.2 from postgres 0.2.4; older releases run on 0.1").
2. "Check against my doze": a version picker on the registry
   (`?doze=0.1.1`, remembered) that greys what won't run and says what to do;
   and `doze modules docs postgres --web` opens the page with your version
   already set.
3. Release states: **current**, **superseded**, **yanked** (kept visible,
   struck through, with a reason and the release to use instead; doze.lock
   pins to a yanked release keep working with a warning), **deprecated**
   module or engine major (dated stages: deprecated on → new projects warned →
   still served to existing pins forever).
4. Security notices on the affected releases (none exist; draw the slot with
   "No known advisories" and, on the versions board only, one clearly
   labelled design example).
5. Release notes per release (from GitHub release notes).
6. A Neon-style compatibility matrix: rows = extensions (or module releases),
   columns = Postgres 14…18, each cell the version available, a dash for "not
   built", a distinct mark for "not possible" (e.g. TimescaleDB on 14), and
   "coming" for not yet.
7. An install box that follows the selected release: the doze.hcl block, the
   `doze add` line, and the exact doze.lock entry it will write.
8. A quality checklist per module, as ticks: signed, all three platforms,
   conformance tested on every listed engine major (CI), every example parsed
   by the current doze (CI), source linked.
9. Tiers: **Official** (doze-dev namespace). Outside publishers are not open
   yet; the Publish page says so honestly and shows how it will work
   (your own namespace and key, pinned on first use).
10. Search across modules, extensions, aliases ("redis" → Valkey and Kvrocks)
    and bring-your-own tools, saying why each matched.

## Shared bits (keep consistent across boards)

- Registry pages share a module header: logo tile (draw a 48px rounded square
  in the module's colour with its initial if no logo), name, one line, badges
  ("Official", "Signed"), facts row (newest release · needs doze · engines ·
  platforms · licence), and tabs: Overview · Versions · Engine versions ·
  Extensions · Reference · Under the hood.
- Status chips: Current (good), Yanked (bad), Deprecated (warn), Needs newer
  doze (warn), Coming (info), Built, not published (dim).
- The "your doze" control: a small pill in the registry header row: "Your
  doze: 0.1.1 ▾ · check" or "Check against your doze ▾" when unset.

## Shared components already built (use them, don't redraw them)

- `SiteHeader` (theme, current, news, newsHref) and `SiteFooter` (theme).
- `RegistryBar` (section = modules|extensions|tools|trust|publish|none, q =
  search text, doze = "" or "0.1.1"): the registry's own bar with search, the
  "check against your doze" picker and the registry sections. Every registry
  page puts it right under SiteHeader: `<dc-import name="RegistryBar"
  section="modules" hint-size="100%,120px"></dc-import>`.
- `RegistryModuleHead` (tab = overview|versions|engines|extensions|reference|
  hood, doze = "" or a version): the postgres module's header with badges,
  facts and tabs. Every postgres module page puts it under RegistryBar:
  `<dc-import name="RegistryModuleHead" tab="versions" hint-size="100%,330px"></dc-import>`.
  If you need a change in a shared component, say so in your report rather
  than editing it.

## CORRECTION (supersedes "Designed min-doze values" anywhere above)

- The oldest-doze field is REAL and written by the release tool (modtool)
  from doze-sdk's `proto.MinHost`, always three numbers: `"0.2.0"`.
- In the index today: postgres 0.2.1–0.2.4 carry no field → they run on every
  doze (0.1.0 and up). The first release that needs doze 0.2.0 is postgres
  **0.2.5** (built 3 Nov 2026, carries `doze: "0.2.0"`, not in the index yet).
  Same for every other module's 3 Nov build (valkey 0.2.2, ferret 0.2.4,
  temporal 0.2.3, mariadb 0.2.2, kvrocks 0.2.2). The coming postgres 0.3
  (extensions) also needs 0.2.0.
- So "your doze is too old" states are drawn as "once 0.2.5 is published";
  label them that way. Messages print the version as written: "needs doze
  0.2.0 or newer".
- The registry key is compiled into doze (`RegistryKey`); doze never reads
  keys.json and does not trust it on first use. First-use pinning is only the
  PLANNED model for outside publishers.
- registry.doze-dev.com does not exist yet; doze fetches from
  `https://doze.nerdmenot.in/registry` (compiled in). Say "will move to
  registry.doze-dev.com with doze 0.2 [planned]" where it matters.
- The only `doze modules` subcommand today is `upgrade` (with `--check`).
  `doze modules search/docs/verify/info` do not exist: mark them new.
- RegistryModuleHead has a new prop `newest` = "0.2.4" (today, default) or
  "0.2.5" (as it will be once published; then "Needs doze 0.2.0 or newer",
  and with doze="0.1.1" the warning shows).
- SiteHeader themes now: dark | light | aws | kafka (the product pages use
  their own ground). The phone menu is a <details> that opens without script.
- Prefix every class in your board's <helmet> with a short board-specific
  prefix (e.g. `.rv-` for RegistryVersions): helmet styles leak into pages
  that import your board.

## LAUNCH RULE (overrides anything above about "today")

The new site goes live together with **doze 0.2**. Write every page as of that
day: doze 0.2 is the current release (date `[0.2 release date]`); the Mac app
(Doze-0.2.dmg) and the cask exist; `doze add`, the `module`/`app`/`service`/
`task` syntax, `.doze` names, domains and `doze trust`, `doze migrate`, the
2-minute sleep, and Larder all work. Do NOT stamp "0.2" chips on features.
Mention 0.1.1 only where it matters:
- upgrading: 0.1.1 can't check a release's minimum doze, so update doze
  before `doze modules upgrade`; 0.1.1 uses the old syntax (`postgres "x" {}`,
  `idle_timeout`, 5-minute default) and has `doze modules list/which/info/
  search/docs` and `doze binaries available`, which 0.2 dropped;
- the registry's "check against your doze" states and the changelog history.
The refusal messages exist from 0.2 and print three-part versions ("needs doze
0.2.0 or newer"); never show "this doze is 0.1.1" as something doze prints.
registry.doze-dev.com is the registry host from 0.2; `doze.nerdmenot.in/registry`
keeps serving older doze (0.1.1 has it compiled in). The key is compiled into
doze; there is no first-use trust and no key in doze.lock.

## House rules from the audit (apply to every board)
- Prompt and muted code colour `#9C8AAB` (never `#7F6C8E`: fails contrast).
- `code, pre { font-variant-ligatures: none }` (">=" must not become "≥").
- A Copy button on every command a reader would run; NONE on commands that
  don't exist yet or are placeholders.
- Code blocks: `white-space: pre; overflow-x: auto` (never break mid-word).
- Phone (≤600px): tables become stacked row cards; nothing scrolls the page
  sideways; gutters 32px; every tap target ≥ 44px tall.
- Prefix every helmet class with a board prefix; no global element rules
  (`pre{}`, `code{}`) except inside your prefix.
- One type scale. Marketing: h1 76–84px, h2 48–52px. Daylight (docs, registry):
  page h1 46px, h2 30px, h3 20px; body ≥ 15px; small text ≥ 13px.
- doze.lock snippets in block style, 4-space indent, as doze writes them.
- "Apache-2.0" everywhere. "doze AWS"/"doze Kafka" in prose, never doze-aws.
- No "[stars]" or any count slot.
