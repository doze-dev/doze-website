// Captures of the real app live in public/media. A page names what it wants
// as [file, alt] pairs in order of preference; the first file that exists
// wins, so a new capture replaces its stand-in the moment it lands, with no
// edit to the page. `pending` names the first choice while it is missing.
import { existsSync } from "node:fs";
import { join } from "node:path";

export type Choice = readonly [file: string, alt: string];
export interface Picked {
  src: string;
  alt: string;
  video: boolean;
  pending?: string;
}

const dir = join(process.cwd(), "public", "media");
const has = (f: string) => existsSync(join(dir, f));
const as = ([f, alt]: Choice, first: Choice): Picked => ({
  src: `/media/${f}`,
  alt,
  video: /\.(webm|mp4)$/.test(f),
  pending: f === first[0] ? undefined : first[0],
});

/** The first choice that exists; the last one if none does. */
export function pick(...choices: Choice[]): Picked {
  return as(choices.find(([f]) => has(f)) ?? choices[choices.length - 1], choices[0]);
}

/** The first choice that exists, or nothing (for a slide that draws its own stand-in). */
export function maybe(...choices: Choice[]): Picked | undefined {
  const c = choices.find(([f]) => has(f));
  return c && as(c, choices[0]);
}
