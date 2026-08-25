export const config = {
  repo: 'PostHog/posthog',
  windowDays: 90,
  minPRsForCohort: 3,

  weights: {
    codeImpact: 0.30,
    contribution: 0.20,
    reliability: 0.20,
    quality: 0.15,
    breadth: 0.15,
  },

  // Multiplier applied to log-diff score per PR type.
  // Higher = more credit for that kind of work.
  conventionalCommitTypeWeights: {
    feat: 1.0,
    perf: 1.0,
    fix: 0.8,
    refactor: 0.7,
    test: 0.6,
    docs: 0.4,
    chore: 0.3,
    build: 0.3,
    ci: 0.3,
    style: 0.2,
  } as Record<string, number>,

  // PRs of these types are considered "code-bearing" for the reliability dimension.
  codeTypes: new Set(['feat', 'fix', 'perf', 'refactor']),

  botLogins: new Set([
    'dependabot',
    'dependabot[bot]',
    'github-actions',
    'github-actions[bot]',
    'posthog-bot',
    'sentry-io',
    'codecov',
    'codecov[bot]',
    'renovate',
    'renovate[bot]',
    'snyk-bot',
    'semantic-release-bot',
    'stale',
    'netlify',
    'vercel',
  ]),

  testPathPatterns: [
    /\/tests?\//i,
    /\/__tests__\//i,
    /\.test\.(ts|tsx|js|jsx|py)$/i,
    /\.spec\.(ts|tsx|js|jsx|py)$/i,
    /test_[^/]+\.(py|ts|js)$/i,
    /cypress\//i,
    /e2e\//i,
    /playwright\//i,
  ] as RegExp[],
};
