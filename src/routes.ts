// Every board on the design canvas and the page it became. Boards link to
// each other by file name (Doze.dc.html); pages link by these paths.
export const routes: Record<string, string> = {
  Main: "/",
  Story: "/tuesday/",
  Doze: "/doze/",
  Aws: "/aws/",
  Kafka: "/kafka/",
  Download: "/download/",
  Examples: "/examples/",
  Changelog: "/changelog/",
  Security: "/security/",
  Brand: "/brand/",
  NotFound: "/404/",
  DocsHome: "/docs/",
  DozeDocs: "/docs/doze/",
  AwsDocs: "/docs/aws/",
  KafkaDocs: "/docs/kafka/",
};

/** The page a board link points at: "Doze.dc.html#x" → "/doze/#x". */
export function hrefFor(board: string): string {
  const [file, hash] = board.split("#");
  const name = file.replace(/\.dc\.html$/, "");
  const path = routes[name];
  if (!path) throw new Error(`no route for board ${name}`);
  return hash ? `${path}#${hash}` : path;
}
