# The doze brand (decided 7 Nov 2026: direction B, "Rest is a feature")

## The idea
Rest as a craft. Your machine works hard when you do and goes quiet when you
don't, and so can you. We sell the evening: the laptop closed, nothing still
running, the fan silent, you gone home. Every claim about rest is paid off with
a number or a thing you can check (OrbStack's rule): asleep means no process.

Headline (home): **Local development that just works.** Chosen 2026-11-07 by the owner: the old headline read as work-life-balance advice, not a reason to use a dev tool.

Sign-off, not the pitch: **Work hard. Then close the lid.** Used only as a closing line at the end of On rest and Tuesday, after the product has been explained. The footer carries the headline (owner, 2026-11-07).
Product line (doze): Run your whole stack. Feel none of it.

## Architecture: a family of three independent products
- The family is **doze** (doze-dev.com). Its mark is **the bat across the moon**: the
  products' sleeping bat, with no tile and no prop, in front of a full moon
  (public/brand/family.svg: plum bat on an amber moon, for night; family-ink.svg: amber
  bat on a plum moon, for daylight). Chosen 2026-11-07 by the owner over the crescent
  moon it replaces. The round moon keeps it apart from the products' rounded-square
  tiles, so the doze app's icon is never read as the family's. It appears only for the
  family: site header, footer, favicon, the manifesto, the ends of the stories. Never
  inside a product. A moon in a night-sky illustration (Tuesday, the long way round) is
  scenery, not the mark: family-moon.svg stays for that.
- The products are equals, each with its own icon and colour, and each works alone:
  **doze** (the bat on amber, /brand/doze.svg), **doze AWS** (sky, /brand/doze-aws.svg),
  **doze Kafka** (yellow, /brand/doze-kafka.svg). When the product doze and the family
  could be confused, say "doze, the app" or "the doze family".
- One sentence shape per product, verb first, about waking and sleeping:
  - doze: Wakes your stack when you start. Sleeps it when you stop.
  - doze AWS: Wakes AWS on your laptop. No account, no bill.
  - doze Kafka: Wakes a Kafka broker. No JVM to put to bed.
- Every product page carries the endorsement: "Part of the doze family. Works alone."
- Navigation: the family mark + "doze" wordmark, then Products ▾ (three product cards with
  icon, line and links to page and docs), Story, Registry, Docs, Changelog; GitHub; "Get doze".
- Postgres extensions are part of the postgres module, not a registry section.

## Voice
Warm, wry, specific. Name the small embarrassing truths ("It grew.", "Getting
started (2023)"). Rest verbs: wake, settle, wind down, sleep, rest. Never
"reap", "idle timeout", "spin up". No superlatives without a number. Lines to
reuse: "Your laptop deserves an evening too." · "Rest is a feature." ·
"Everything wakes when called. Everything sleeps when you're done." ·
"Fans off. Stack on." · "Close the lid. Nothing's still running."

## Look
Night palette (plum #140C1B ground, amber #F0A24B lamp) with warm paper daylight
for docs and the registry. Time of day is a design material: dusk→night as the
home page scrolls, the Tuesday story told by light. A fine grain on night
grounds (CSS). Real product UI as proof; illustration only for the bats, the night-sky moon and the
product mascots. Bricolage Grotesque / Geist / JetBrains Mono.

## Motion
- Tokens: --ease-out cubic-bezier(.2,.8,.2,1); --ease-settle cubic-bezier(.4,0,.2,1);
  durations 120 / 200 / 280 ms; one slow 800 ms "settle" reserved for things falling asleep.
- Only transform and opacity. Never animate keyboard-initiated actions or copy buttons.
- Signature: things that sleep breathe (a slow 4 s pulse of a status dot), wake with a snap
  on interaction; the bat swings on its perch on hover of the family mark.
- Sections reveal once as they enter (fade + 12px rise, 280 ms), never re-animate.
- Sequences (a tour, the services, the "small things") use a vertical carousel with dot
  navigation: scroll-snap inside a pinned frame, dots as real buttons, keyboard and swipe.
- Pages cross-fade (View Transitions); in-page anchors scroll smoothly.
- prefers-reduced-motion: no pinning, no parallax, no breathing; crossfades only.

## The pains we name (use them across the site, honestly, no vendor names)
1. Which terminal was that? Seven ways to start seven things (package.json, pyproject.toml, Makefile, compose, a script).
2. Port roulette, and ports you keep in your head; last week's project still holding 5432.
3. The fan: a VM holding every database all day, used or not.
4. The AI that can read every file but can't see your machine.
5. Coming back after months: the setup doc rotted, new services you've never seen.
6. Closing the lid with 23 containers still up.
7. **Local development didn't get fixed. It got moved.** Teams give up on local, move to remote dev
   environments run by a platform team: debuggers that won't attach through tunnels, port-forward
   juggling, logs in another tool, and when the dev environment is down (no ETA, the platform team
   in another timezone or busy with production) nobody can work. "You needed a platform team just
   to write code." doze's answer: it all runs on your laptop again, natively; a breakpoint just hits;
   nobody's pager is involved; platform teams build the platform instead of babysitting dev boxes.

## The app leads (owner, 7 Nov: "people love GUIs")
The doze app is the hero of doze. On the home page, the app is the first thing
you see after the headline: a large, real window (captures of the real app
running the Larder example), alive (a short loop of services waking and
falling asleep), not a thumbnail. The doze page is built around the app as a
guided tour (vertical dot carousel): Library → a stack as tiles / list / map →
inside a service → ⌘K → Needs you → the menu bar → themes. The CLI is shown as
"and everything is a command too", second, never first.
Captures: public/media/app-*.webp and app-rec-*.webm (real app, Larder).
