const GITHUB_GRAPHQL = 'https://api.github.com/graphql';

// 1 second between requests keeps us well within GitHub's secondary rate limits.
const REQUEST_INTERVAL_MS = 1000;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface GraphQLResponse<T> {
  data?: T;
  errors?: Array<{ message: string; type?: string }>;
}

let lastRequestAt = 0;

export async function graphql<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN is not set. Copy .env.example to .env and add your token.');
  }

  // Throttle to one request per second
  const elapsed = Date.now() - lastRequestAt;
  if (elapsed < REQUEST_INTERVAL_MS) {
    await sleep(REQUEST_INTERVAL_MS - elapsed);
  }
  lastRequestAt = Date.now();

  const response = await fetch(GITHUB_GRAPHQL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'posthog-analyzer/1.0',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (response.status === 403 || response.status === 429) {
    const retryAfter = response.headers.get('Retry-After');
    const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 60_000;
    console.warn(`Rate limited. Waiting ${waitMs / 1000}s...`);
    await sleep(waitMs);
    return graphql(query, variables);
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status}: ${body}`);
  }

  const result = (await response.json()) as GraphQLResponse<T>;

  if (result.errors?.length) {
    const rateLimitError = result.errors.find(e =>
      e.message.toLowerCase().includes('rate limit') ||
      e.type === 'RATE_LIMITED',
    );

    if (rateLimitError) {
      // GitHub returns rate limit resets in the response headers even on 200s.
      const resetHeader = response.headers.get('x-ratelimit-reset');
      const resetAt = resetHeader ? parseInt(resetHeader, 10) * 1000 : Date.now() + 60_000;
      const waitMs = Math.max(resetAt - Date.now(), 5_000);
      const waitSec = Math.ceil(waitMs / 1000);
      console.warn(`\nRate limited by GitHub. Waiting ${waitSec}s for reset...`);
      await sleep(waitMs + 2_000); // +2s buffer past the reset
      return graphql(query, variables);
    }

    throw new Error(`GraphQL errors: ${result.errors.map(e => e.message).join('; ')}`);
  }

  if (!result.data) {
    throw new Error('GraphQL response missing data field');
  }

  return result.data;
}
