import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { graphql } from '../github/client.js';
import { PR_SEARCH_QUERY } from '../github/queries.js';
import { filterAndAnnotatePR } from './filters.js';
import { config } from '../config.js';
import type { PullRequest } from '../github/types.js';

const RAW_FILE = 'data/raw.json';

interface Checkpoint {
  fetchedAt: string;
  days: number;
  completedRanges: string[]; // "from..to" keys already saved
  prs: PullRequest[];
}

interface SearchData {
  search: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: PullRequest[];
  };
}

// Split the window into weekly buckets so each search stays under GitHub's
// 1,000-result cap (PostHog merges ~210–420 PRs/week).
function buildDateRanges(days: number): Array<{ from: string; to: string }> {
  const CHUNK_DAYS = 7;
  const ranges: Array<{ from: string; to: string }> = [];
  const now = Date.now();

  for (let offset = 0; offset < days; offset += CHUNK_DAYS) {
    const toMs = now - offset * 86_400_000;
    const fromMs = now - Math.min(offset + CHUNK_DAYS, days) * 86_400_000;
    ranges.push({
      from: new Date(fromMs).toISOString().slice(0, 10),
      to: new Date(toMs).toISOString().slice(0, 10),
    });
  }

  return ranges;
}

function rangeKey(from: string, to: string): string {
  return `${from}..${to}`;
}

function loadCheckpoint(days: number): Checkpoint | null {
  if (!existsSync(RAW_FILE)) return null;
  try {
    const saved = JSON.parse(readFileSync(RAW_FILE, 'utf-8')) as Partial<Checkpoint>;
    // Only resume if the saved file is for the same window and has checkpoint data.
    if (saved.days === days && Array.isArray(saved.completedRanges)) {
      return saved as Checkpoint;
    }
  } catch {
    // Corrupted file — start fresh.
  }
  return null;
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  mkdirSync('data', { recursive: true });
  writeFileSync(RAW_FILE, JSON.stringify(checkpoint, null, 2));
}

async function fetchRange(from: string, to: string): Promise<PullRequest[]> {
  const q = `repo:${config.repo} is:pr is:merged merged:${from}..${to}`;
  const prs: PullRequest[] = [];
  let cursor: string | null = null;
  let page = 1;

  do {
    process.stdout.write(`    page ${page}... `);
    const result: SearchData = await graphql<SearchData>(PR_SEARCH_QUERY, { query: q, cursor });
    const { nodes, pageInfo } = result.search;
    const batch = nodes.filter((n: PullRequest): n is PullRequest => n != null && 'number' in n);
    prs.push(...batch);
    console.log(`${batch.length} PRs (total so far: ${prs.length})`);
    cursor = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    page++;
  } while (cursor);

  return prs;
}

export async function fetchAllPRs(days: number): Promise<void> {
  const ranges = buildDateRanges(days);
  const checkpoint = loadCheckpoint(days);

  const completedRanges = new Set(checkpoint?.completedRanges ?? []);
  const allPRs: PullRequest[] = checkpoint?.prs ?? [];

  const remaining = ranges.filter(r => !completedRanges.has(rangeKey(r.from, r.to)));

  if (checkpoint && completedRanges.size > 0) {
    console.log(`\nResuming — ${completedRanges.size}/${ranges.length} ranges already saved (${allPRs.length} PRs)`);
  } else {
    console.log(`\nFetching merged PRs — last ${days} days of ${config.repo}`);
  }

  const startSize = completedRanges.size;
  for (const [i, { from, to }] of remaining.entries()) {
    const overallIndex = startSize + i + 1;
    console.log(`\n[${overallIndex}/${ranges.length}] ${from} → ${to}`);

    const prs = await fetchRange(from, to);
    const filtered = prs
      .map(filterAndAnnotatePR)
      .filter((p): p is PullRequest => p !== null);

    allPRs.push(...filtered);
    completedRanges.add(rangeKey(from, to));
    console.log(`  ✓ ${filtered.length} kept, ${prs.length - filtered.length} bots filtered`);

    // Checkpoint after every range so a crash never loses more than one week.
    saveCheckpoint({
      fetchedAt: new Date().toISOString(),
      days,
      completedRanges: Array.from(completedRanges),
      prs: allPRs,
    });
    console.log(`  💾 Saved checkpoint (${allPRs.length} PRs total)`);
  }

  const authorCount = new Set(allPRs.map(p => p.author?.login)).size;
  console.log(`\nDone: ${allPRs.length} PRs across ${authorCount} authors`);
  console.log('Written → data/raw.json\n');
}
