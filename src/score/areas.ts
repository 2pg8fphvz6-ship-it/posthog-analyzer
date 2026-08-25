// Maps a file path's top-level directory to a human-readable product area.
// Anything not explicitly mapped falls back to its raw top-level directory name.
const AREA_MAP: Record<string, string> = {
  frontend: 'Frontend',
  posthog: 'Backend',
  ee: 'Enterprise',
  'plugin-server': 'Plugin Server',
  rust: 'Rust',
  cypress: 'E2E Tests',
  hogql_parser: 'HogQL',
  bin: 'Scripts',
  docker: 'Infrastructure',
  '.github': 'CI/CD',
  playwright: 'E2E Tests',
};

export function pathToArea(filePath: string): string {
  const topLevel = filePath.split('/')[0];
  return AREA_MAP[topLevel] ?? topLevel;
}
