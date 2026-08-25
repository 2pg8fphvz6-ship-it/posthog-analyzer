import { readFileSync, writeFileSync } from 'fs';
import { config } from '../config.js';
import type { PullRequest } from '../github/types.js';
import {
  computeCodeImpact,
  computeContribution,
  computeReliability,
  computeQuality,
  computeBreadth,
  computeMetrics,
} from './dimensions.js';
import type { EngineerMetrics } from './dimensions.js';
import { normalizeScores } from './normalize.js';

interface RawSnapshot {
  fetchedAt: string;
  days: number;
  completedRanges?: string[];
  prs: PullRequest[];
}

export interface EngineerScore {
  login: string;
  impact: number;
  prCount: number;
  dimensions: {
    codeImpact: number;
    contribution: number;
    reliability: number;
    quality: number;
    breadth: number;
  };
  metrics: EngineerMetrics;
}

type DimensionKey = 'codeImpact' | 'contribution' | 'reliability' | 'quality' | 'breadth';

const DIMENSIONS: DimensionKey[] = [
  'codeImpact',
  'contribution',
  'reliability',
  'quality',
  'breadth',
];

export function scoreAll(): void {
  const raw: RawSnapshot = JSON.parse(readFileSync('data/raw.json', 'utf-8'));
  const { prs } = raw;

  // Group authored PRs by login, excluding known bots
  const byAuthor = new Map<string, PullRequest[]>();
  for (const pr of prs) {
    const login = pr.author?.login;
    if (!login) continue;
    if (config.botLogins.has(login)) continue;
    if (!byAuthor.has(login)) byAuthor.set(login, []);
    byAuthor.get(login)!.push(pr);
  }

  // Apply cohort threshold
  const cohort = Array.from(byAuthor.entries()).filter(
    ([, authored]) => authored.length >= config.minPRsForCohort,
  );

  const totalRanges = Math.ceil(raw.days / 7);
  const completedRanges = raw.completedRanges?.length ?? totalRanges;
  if (completedRanges < totalRanges) {
    console.warn(`⚠️  Partial data: ${completedRanges}/${totalRanges} weekly ranges collected. Run collect again to complete.`);
  }

  console.log(
    `Cohort: ${cohort.length} engineers with ≥${config.minPRsForCohort} PRs (${byAuthor.size - cohort.length} below threshold)`,
  );

  // Compute raw scores and concrete metrics for each engineer
  const rawScores: Record<string, Record<DimensionKey, number>> = {};
  const allMetrics: Record<string, EngineerMetrics> = {};
  for (const [login, authored] of cohort) {
    const data = { login, authoredPRs: authored, allPRs: prs };
    rawScores[login] = {
      codeImpact: computeCodeImpact(data),
      contribution: computeContribution(data),
      reliability: computeReliability(data),
      quality: computeQuality(data),
      breadth: computeBreadth(data),
    };
    allMetrics[login] = computeMetrics(data);
  }

  // Normalize to percentile ranks
  const normalized = normalizeScores(rawScores, DIMENSIONS);

  // Compute weighted impact score and assemble output
  const engineers: EngineerScore[] = cohort
    .map(([login, authored]) => {
      const dims = normalized[login];
      const impact =
        config.weights.codeImpact * dims.codeImpact +
        config.weights.contribution * dims.contribution +
        config.weights.reliability * dims.reliability +
        config.weights.quality * dims.quality +
        config.weights.breadth * dims.breadth;

      return {
        login,
        impact: round(impact),
        prCount: authored.length,
        dimensions: {
          codeImpact: round(dims.codeImpact),
          contribution: round(dims.contribution),
          reliability: round(dims.reliability),
          quality: round(dims.quality),
          breadth: round(dims.breadth),
        },
        metrics: allMetrics[login],
      };
    })
    .sort((a, b) => b.impact - a.impact);

  const output = {
    generatedAt: new Date().toISOString(),
    fetchedAt: raw.fetchedAt,
    days: raw.days,
    prCount: prs.length,
    engineerCount: engineers.length,
    weights: config.weights,
    engineers,
  };

  writeFileSync('data/scores.json', JSON.stringify(output, null, 2));
  console.log(`Written → data/scores.json (${engineers.length} engineers)`);

  console.log('\nTop 10:');
  engineers.slice(0, 10).forEach((e, i) => {
    const { codeImpact: ci, contribution: co, reliability: r, quality: q, breadth: b } =
      e.dimensions;
    console.log(
      `  ${String(i + 1).padStart(2)}. ${e.login.padEnd(24)} impact=${e.impact.toFixed(3)}` +
        `  ci=${ci.toFixed(2)} co=${co.toFixed(2)} r=${r.toFixed(2)} q=${q.toFixed(2)} b=${b.toFixed(2)}` +
        `  (${e.prCount} PRs)`,
    );
  });
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}
