# Building doze-dev.com from the design boards

The design is the canvas, snapshotted in `design/boards/*.dc.html` (one file per
board) with its brief in `design/BRIEF.md` (read the LAUNCH RULE and House rules
at the end: they override earlier parts). The site is Astro 7. This file is
how a board becomes a page.

## What exists (shared; owned by the lead, ask before changing)
- `src/layouts/Page.astro` — every non-docs page: `<Page title theme current news newsHref>`.
  Themes `dark | light | aws | kafka`; `current` = home, doze, aws, kafka, registry, examples, docs, download, changelog, none.
- `src/components/SiteHeader.astro`, `SiteFooter.astro` — never redraw them.
- `src/components/RegistryBar.astro` (`section`, `q`) and `ModuleHead.astro` (`module`, `tab`, `crumb`) — every registry page.
- `src/scripts/copy.ts` (loaded by Page): `<button type="button" data-copy="text">Copy</button>` or `data-copy-from="#id"`.
- `src/scripts/doze-check.ts` (loaded by RegistryBar): `data-needs="0.2.0"` gets class `dz-too-old` when the reader's doze is older; `data-doze-when="set|unset"`; `data-doze-text`; `data-doze-pick`.
- `src/lib/registry.ts` — the real registry (`modules`, `getModule`, `display`, `needs`, `runsOn`, `engineRange`, `platformLabel`, `fmtDate`, `look`), from `src/data/registry.json` written by `scripts/registry-pull.ts`.
- `src/routes.ts` — board name → URL (`hrefFor("Registry.dc.html")`). Every `X.dc.html` link in a board becomes the route.
- `design/media-map.json` — every `/_blob/<id>` in a board → `/media/…` or `/brand/…`.
- `src/styles/tokens.css` (colours, `--font-display/text/mono`, self-hosted fonts) and `site.css` (reset, `[hidden]`, `.sr-only`, `.skip`).

## Porting a board
1. Read the board's markup inside `<x-dc>` and its `renderVals()`. The page is that markup, in `.astro`:
   - `<dc-import name="SiteHeader|SiteFooter">` → gone (Page draws them). `RegistryBar` / `RegistryModuleHead` → the components.
     Other imports (Popular, Tour, AwsServices) → your own component in `src/components/<area>/`.
   - `{{holes}}`, `<sc-for>`, `<sc-if>` → frontmatter data and `.map()` / conditionals.
   - Interactivity (onClick, state) → a small plain script (`<script>` in the component, or `src/scripts/<name>.ts`): no framework. Render every state server-side and toggle with attributes, so the page works without script where it can.
   - Inline `style="…"` → scoped `<style>` classes, prefixed per page. Keep the board's look exactly: sizes, colours, spacing, breakpoints.
   - Google Fonts links → drop (fonts are self-hosted via tokens.css).
2. Real data over board literals wherever the board shows registry facts: modules, releases, dates, hashes, needs-doze, engine versions come from `src/lib/registry.ts`. Where the board describes the launch state (e.g. postgres 0.2.5 published) and the index doesn't have it yet, the page shows what the index says; it updates itself when the index does. Never invent.
3. Links: real routes; external links real. No `href="#"`.
4. Accessibility as the boards: real buttons/links, labels, aria where needed, contrast ≥ 4.5:1, 44px targets on phone.

## Running
- Data first (once): `bun run data` (pulls docs and the registry).
- Your own dev server on your own port, no rebuild of data: `bunx astro dev --port <yours>`.
  Ports: home/doze/story 4401, product+marketing 4402, registry finding 4403, registry modules 4404, docs 4405.
- Screenshot to check by eye: `bun /private/tmp/claude-501/-Users-srini-Code-doze-dev/7b22fd62-a94d-4e3a-bd10-f71bb12a1385/scratchpad/shot-url.ts <outdir> <width> <path>…`
  (set `BASE=http://127.0.0.1:<your port>`). Check 1440 and 390; it prints OVERFLOW if the page scrolls sideways.
- Don't run `bun run build` or `bun run format` on the whole repo (others are working in it); the lead runs builds. `bunx biome check <your files>` and `bunx astro-check` are fine.
- Commit nothing; the lead commits.
