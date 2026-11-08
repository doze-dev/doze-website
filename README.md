# doze-website

> [!WARNING]
> **Still in active development.** This project is not cleared for use yet. Expect breaking changes, and do not rely on it for real work.

The source of [doze-dev.com](https://doze-dev.com): the doze family's home page,
the product pages for doze, doze AWS and doze Kafka, the registry, and the docs.

## Run it

Tool versions live in `.prototools` (bun, node); `proto install` sets them up.

```sh
bun install
bun run dev        # http://localhost:4321, docs pulled from the sibling repos
```

## How it fits together

| Path                                        | What             | Where it comes from                       |
| ------------------------------------------- | ---------------- | ----------------------------------------- |
| `/`, `/doze/`, `/aws/`, `/kafka/`           | marketing pages  | `src/pages/*.astro`                       |
| `/registry/`                                | the registry     | `src/pages/registry/`                     |
| `/docs/doze/`, `/docs/aws/`, `/docs/kafka/` | docs (Starlight) | each product's repo, pulled at build time |

Docs live beside the code they describe, so a change and its docs land in one
PR. `scripts/docs-pull.ts` copies them in according to `sources.json`:

- Locally it reads the sibling checkouts (`../doze`, `../doze-aws`,
  `../doze-kafka`), so editing a doc there shows up on the next reload.
- In CI (or with `DOCS_SOURCE=git`) it shallow-clones each repo at the `ref`
  in `sources.json`.
- On the way in it adds titles to pages without frontmatter, turns `README.md`
  into the section index, rewrites links for `/docs/<product>/`, sends links to
  code to GitHub, and lists links that are broken in the source repo.

The pulled pages land in `src/content/docs/docs/` and are not committed.
Each product's sidebar is in `src/sidebars.ts`.

## Checks

```sh
bun run check      # astro-check (types) and biome (lint, format)
bun run build      # pull docs and build to dist/
bun run links      # every internal link in dist/ must resolve
bun run format     # biome, with fixes
```

CI (`.github/workflows/site.yml`) runs all four on every PR and push, deploys
each PR to a preview URL and `main` to production. It also runs nightly and
when a product repo sends a `docs-changed` repository dispatch.

## Deploy

One Cloudflare Pages project, `doze-website`, static files only. CI deploys
with `wrangler pages deploy`; it needs the repository secrets
`CLOUDFLARE_API_TOKEN` (Pages: Edit) and `CLOUDFLARE_ACCOUNT_ID`.
`public/_redirects` keeps the old doze.nerdmenot.in docs paths working;
`public/_headers` sets security and caching headers.

## Brand

`site.ts` holds the tagline and the shared links. `src/styles/tokens.css`
holds the colours and fonts (self-hosted, nothing loads from Google).
The product icons are generated: see `brand/README.md`.

## Licence

Apache 2.0.
