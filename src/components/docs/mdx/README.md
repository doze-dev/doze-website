# Components for docs pages

The docs pages live in each product's repo and are pulled in by
`scripts/docs-pull.ts`. A page that wants one of these components must be an
`.mdx` file and import it through the `@docs/` alias (set in `tsconfig.json`):

```mdx
import HowTo from "@docs/HowTo.astro";
import Shot from "@docs/Shot.astro";
import Keys from "@docs/Keys.astro";
import Steps from "@docs/Steps.astro";
```

| Component | What it draws                                                                                                                                                                                                                                      | Board        |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| `HowTo`   | Two tabs, "In the app" and "In a terminal" (slots `app`, `terminal`). The reader's pick is remembered on every page (Starlight `syncKey="how"`).                                                                                                   | Docs2Task    |
| `Shot`    | A screenshot: `src` (an imported image, or a `/public` path), `alt`, `caption`, optional numbered `callouts` `{ n, x, y, title?, text? }` (x, y in % of the image). Callouts with words get a legend. `crop` shows only the top of a tall capture. | Docs2AppPage |
| `Keys`    | The two-column key table: `keys={[["1–4", "Tiles, List, Map, Grid"], ["↑ ↓ j k", "move"]]}`. Spaces separate keys; `a–b` is a range.                                                                                                               | Docs2AppPage |
| `Steps`   | Starlight's `<Steps>` as amber numbered circles. Wrap one ordered list.                                                                                                                                                                            | Docs2Task    |

A task, written app first:

````mdx
<HowTo>
<Fragment slot="app">

<Shot src={library} alt="The Library with larder up" caption="The Library after step 3." crop />

<Steps>

1. **Open doze.** From Applications, or type `doze` in a terminal.
2. **Drop the `larder` folder on the window,** or press <kbd>⌘O</kbd> and pick it.

</Steps>

</Fragment>
<Fragment slot="terminal">

```sh
cd doze-examples/larder
doze up
````

</Fragment>
</HowTo>
```

Leave a blank line after each opening tag and before each closing tag, or
the markdown inside is not parsed.

Images: put captures beside the page in the product repo and import them
relatively (`import library from "../../assets/app/library-light.webp"`);
docs-pull copies every image a page points at into the section's `_assets/`
folder, keeping its path, and rewrites the import.

A product repo that builds these pages with its own Astro site needs the same
alias pointing at stand-ins, or it cannot compile them.
