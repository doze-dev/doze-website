// The Tuesday, as an ordered list of steps. Each step is a COMPLETE stage
// state (never a change from the step before), so a jump, a fast scroll or a
// deep link lands on the right picture. The stage marks what each step shows
// with on(...) and the script reads the step's facts from its beat.

export type Light =
  | "dawn"
  | "morning"
  | "noon"
  | "afternoon"
  | "evening"
  | "dark"
  | "late"
  | "rewind"
  | "calm"
  | "calm-evening"
  | "night";

export interface Step {
  id: string;
  ch: string; // rail chapter
  clock: string; // "9:02"
  light: Light;
  fan: 0 | 1 | 2 | 3;
  heat: number; // 0..1
  lid?: "closed";
  doze?: true;
}

export const steps: Step[] = [
  { id: "cold", ch: "0857", clock: "8:57", light: "dawn", fan: 1, heat: 0.15 },
  { id: "0902a", ch: "0902", clock: "9:02", light: "morning", fan: 1, heat: 0.15 },
  { id: "0902b", ch: "0902", clock: "9:04", light: "morning", fan: 1, heat: 0.2 },
  { id: "0920a", ch: "0920", clock: "9:20", light: "morning", fan: 2, heat: 0.3 },
  { id: "0920b", ch: "0920", clock: "9:22", light: "morning", fan: 2, heat: 0.35 },
  { id: "0920c", ch: "0920", clock: "9:31", light: "morning", fan: 2, heat: 0.4 },
  { id: "0920d", ch: "0920", clock: "9:48", light: "morning", fan: 2, heat: 0.45 },
  { id: "1130a", ch: "1130", clock: "11:30", light: "noon", fan: 2, heat: 0.5 },
  { id: "1130b", ch: "1130", clock: "11:31", light: "noon", fan: 3, heat: 0.55 },
  { id: "1130c", ch: "1130", clock: "11:34", light: "noon", fan: 3, heat: 0.6 },
  { id: "1130d", ch: "1130", clock: "11:36", light: "noon", fan: 3, heat: 0.65 },
  { id: "1400a", ch: "1400", clock: "14:00", light: "afternoon", fan: 3, heat: 0.7 },
  { id: "1400b", ch: "1400", clock: "14:06", light: "afternoon", fan: 3, heat: 0.75 },
  { id: "1400c", ch: "1400", clock: "14:21", light: "afternoon", fan: 3, heat: 0.8 },
  { id: "1530a", ch: "1530", clock: "15:30", light: "late", fan: 3, heat: 0.8 },
  { id: "1530b", ch: "1530", clock: "15:42", light: "late", fan: 3, heat: 0.8 },
  { id: "1530c", ch: "1530", clock: "16:05", light: "late", fan: 3, heat: 0.82 },
  { id: "1530d", ch: "1530", clock: "16:50", light: "late", fan: 3, heat: 0.84 },
  { id: "1840a", ch: "1840", clock: "18:40", light: "evening", fan: 3, heat: 0.85 },
  { id: "1840b", ch: "1840", clock: "18:41", light: "evening", fan: 3, heat: 1, lid: "closed" },
  { id: "1840c", ch: "1840", clock: "19:30", light: "dark", fan: 3, heat: 1, lid: "closed" },
  { id: "rewind", ch: "rewind", clock: "8:57", light: "rewind", fan: 0, heat: 0 },
  { id: "d0902", ch: "doze", clock: "9:02", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d0903", ch: "doze", clock: "9:03", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d0905", ch: "doze", clock: "9:05", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d1130", ch: "doze", clock: "11:30", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d1131", ch: "doze", clock: "11:31", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d1133", ch: "doze", clock: "11:33", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d1400", ch: "doze", clock: "14:00", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d1406", ch: "doze", clock: "14:06", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d1530", ch: "doze", clock: "15:30", light: "calm", fan: 0, heat: 0, doze: true },
  { id: "d1840", ch: "doze", clock: "18:40", light: "calm-evening", fan: 0, heat: 0, doze: true },
  { id: "d1842", ch: "doze", clock: "18:42", light: "calm-evening", fan: 0, heat: 0, doze: true },
  { id: "d1900", ch: "doze", clock: "18:43", light: "night", fan: 0, heat: 0, lid: "closed", doze: true },
];

export const step = (id: string): Step => {
  const s = steps.find((x) => x.id === id);
  if (!s) throw new Error(`no step ${id}`);
  return s;
};

const ix = (id: string) => {
  const i = steps.findIndex((x) => x.id === id);
  if (i < 0) throw new Error(`no step ${id}`);
  return i;
};

/** The steps an element shows in: "id" alone, or [from, to] inclusive. */
export function on(...parts: (string | [string, string])[]): string {
  const out: string[] = [];
  for (const p of parts) {
    const [a, b] = typeof p === "string" ? [p, p] : p;
    for (let i = ix(a); i <= ix(b); i++) out.push(steps[i].id);
  }
  return out.join(" ");
}

/** The rail: one stop per chapter, in story order. */
export const chapters = [
  { id: "0857", label: "8:57", name: "Cold open" },
  { id: "0902", label: "9:02", name: "Morning: the tabs" },
  { id: "0920", label: "9:20", name: "Morning: the ports" },
  { id: "1130", label: "11:30", name: "Noon: ask the AI" },
  { id: "1400", label: "14:00", name: "Afternoon: billing" },
  { id: "1530", label: "15:30", name: "Afternoon: how we got here" },
  { id: "1840", label: "18:40", name: "Evening: close the lid" },
  { id: "rewind", label: "↺", name: "Rewind" },
  { id: "doze", label: "doze", name: "The same day, in the doze app" },
];
