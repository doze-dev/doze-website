// Every board on the design canvas and the page it became. Boards link to
// each other by file name (Registry.dc.html); pages link by these paths.
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
  Registry: "/registry/",
  RegistrySearch: "/registry/search/",
  RegistryNoResults: "/registry/search/",
  RegistryForYourDoze: "/registry/?doze=0.1.1",
  RegistryExtensions: "/registry/extensions/",
  RegistryTool: "/registry/tools/mongo/",
  RegistryModule: "/registry/doze/postgres/",
  RegistryTooOld: "/registry/doze/postgres/?doze=0.1.1",
  RegistryVersions: "/registry/doze/postgres/versions/",
  RegistryRelease: "/registry/doze/postgres/0.2.4/",
  RegistryReleaseOld: "/registry/doze/postgres/0.2.1/",
  RegistryEngines: "/registry/doze/postgres/engines/",
  RegistryReference: "/registry/doze/postgres/reference/",
  RegistryExtension: "/registry/doze/postgres/extensions/vector/",
  RegistryTrust: "/registry/trust/",
  RegistryPublisher: "/registry/doze/",
  RegistryPublish: "/registry/publish/",
};

/** The page a board link points at: "Registry.dc.html#x" → "/registry/#x". */
export function hrefFor(board: string): string {
  const [file, hash] = board.split("#");
  const name = file.replace(/\.dc\.html$/, "");
  const path = routes[name];
  if (!path) throw new Error(`no route for board ${name}`);
  return hash ? `${path}#${hash}` : path;
}
