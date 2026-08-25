import { config } from '../config.js';
import { isBot } from '../collect/filters.js';
import { pathToArea } from './areas.js';
import type { PullRequest } from '../github/types.js';

export interface EngineerData {
  login: string;
  authoredPRs: PullRequest[];
  allPRs: PullRequest[];
}

export interface EngineerMetrics {
  // codeImpact
  prsMerged: number;
  linesChanged: number;
  prsByType: Record<string, number>;
  // contribution
  reviewsGiven: number;
  inlineReviewComments: number;
  reviewsApproved: number;
  reviewsChangesRequested: number;
  reviewsCommented: number;
  // reliability
  codePRsTotal: number;
  codePRsWithTests: number;
  // quality
  commentsAuthored: number;
  avgCommentLength: number;
  commentsWithCodeBlocks: number;
  // breadth
  areasCount: number;
  areas: string[];
}

export function computeMetrics(data: EngineerData): EngineerMetrics {
  const { login, authoredPRs, allPRs } = data;

  // --- codeImpact metrics ---
  const linesChanged = authoredPRs.reduce((s, pr) => s + pr.additions + pr.deletions, 0);
  const prsByType: Record<string, number> = {};
  for (const pr of authoredPRs) {
    const t = pr.conventionalType ?? 'other';
    prsByType[t] = (prsByType[t] ?? 0) + 1;
  }

  // --- contribution metrics ---
  let reviewsGiven = 0, inlineReviewComments = 0;
  let reviewsApproved = 0, reviewsChangesRequested = 0, reviewsCommented = 0;
  for (const pr of allPRs) {
    if (pr.author?.login === login) continue;
    for (const review of pr.reviews.nodes) {
      if (review.author?.login !== login || isBot(review.author)) continue;
      reviewsGiven++;
      inlineReviewComments += review.comments.nodes.length;
      if (review.state === 'APPROVED') reviewsApproved++;
      else if (review.state === 'CHANGES_REQUESTED') reviewsChangesRequested++;
      else if (review.state === 'COMMENTED') reviewsCommented++;
    }
  }

  // --- reliability metrics ---
  const codePRs = authoredPRs.filter(pr => config.codeTypes.has(pr.conventionalType ?? ''));
  const codePRsWithTests = codePRs.filter(pr =>
    pr.files.nodes.some(f => config.testPathPatterns.some(p => p.test(f.path))),
  ).length;

  // --- quality metrics ---
  const bodies: string[] = [];
  for (const pr of allPRs) {
    for (const c of pr.comments.nodes) {
      if (c.author?.login === login && c.body.length > 20) bodies.push(c.body);
    }
    for (const review of pr.reviews.nodes) {
      if (review.author?.login !== login) continue;
      if (review.body.length > 20) bodies.push(review.body);
      for (const rc of review.comments.nodes) {
        if (rc.author?.login === login && rc.body.length > 20) bodies.push(rc.body);
      }
    }
  }
  const avgCommentLength = bodies.length
    ? Math.round(bodies.reduce((s, b) => s + b.length, 0) / bodies.length)
    : 0;
  const commentsWithCodeBlocks = bodies.filter(b => b.includes('```')).length;

  // --- breadth metrics ---
  const areaSet = new Set<string>();
  for (const pr of authoredPRs) {
    for (const f of pr.files.nodes) areaSet.add(pathToArea(f.path));
  }
  const areas = Array.from(areaSet).sort();

  return {
    prsMerged: authoredPRs.length,
    linesChanged,
    prsByType,
    reviewsGiven,
    inlineReviewComments,
    reviewsApproved,
    reviewsChangesRequested,
    reviewsCommented,
    codePRsTotal: codePRs.length,
    codePRsWithTests,
    commentsAuthored: bodies.length,
    avgCommentLength,
    commentsWithCodeBlocks,
    areasCount: areaSet.size,
    areas,
  };
}

// --- codeImpact (0.30) ---
// Sum of log-dampened diff sizes, weighted by conventional commit type.
// log(1 + size) prevents large-diff gaming while still rewarding substantive work.
export function computeCodeImpact(data: EngineerData): number {
  let score = 0;
  for (const pr of data.authoredPRs) {
    const typeWeight =
      config.conventionalCommitTypeWeights[pr.conventionalType ?? ''] ?? 0.5;
    score += Math.log1p(pr.additions + pr.deletions) * typeWeight;
  }
  return score;
}

// --- contribution (0.20) ---
// Weighted review activity on others' PRs.
export function computeContribution(data: EngineerData): number {
  const { login, allPRs } = data;
  let score = 0;

  for (const pr of allPRs) {
    if (pr.author?.login === login) continue; // skip own PRs

    for (const review of pr.reviews.nodes) {
      if (review.author?.login !== login) continue;
      if (isBot(review.author)) continue;

      switch (review.state) {
        case 'CHANGES_REQUESTED':
          score += 1.5;
          break;
        case 'COMMENTED':
          if (review.body.length > 50) score += 1.0;
          break;
        case 'APPROVED':
          score += 0.5;
          break;
      }

      // Each inline comment is additional evidence of engagement
      score += review.comments.nodes.length * 0.3;
    }
  }

  return score;
}

// --- reliability (0.20) ---
// Fraction of code-bearing PRs (feat/fix/perf/refactor) that touch a test file.
export function computeReliability(data: EngineerData): number {
  const codePRs = data.authoredPRs.filter(pr =>
    config.codeTypes.has(pr.conventionalType ?? ''),
  );

  if (codePRs.length === 0) return 0;

  const withTests = codePRs.filter(pr =>
    pr.files.nodes.some(file =>
      config.testPathPatterns.some(pattern => pattern.test(file.path)),
    ),
  );

  return withTests.length / codePRs.length;
}

// --- quality (0.15) ---
// Heuristic over all comments the engineer authored across the dataset.
// Signals: avg length (capped), code block fraction, structured-list fraction, volume.
export function computeQuality(data: EngineerData): number {
  const { login, allPRs } = data;
  const bodies: string[] = [];

  for (const pr of allPRs) {
    for (const comment of pr.comments.nodes) {
      if (comment.author?.login === login && comment.body.length > 20) {
        bodies.push(comment.body);
      }
    }
    for (const review of pr.reviews.nodes) {
      if (review.author?.login !== login) continue;
      if (review.body.length > 20) bodies.push(review.body);
      for (const rc of review.comments.nodes) {
        if (rc.author?.login === login && rc.body.length > 20) bodies.push(rc.body);
      }
    }
  }

  if (bodies.length === 0) return 0;

  const avgLength = bodies.reduce((s, b) => s + b.length, 0) / bodies.length;
  const lengthScore = Math.min(avgLength / 300, 1); // saturates at 300-char avg

  const codeBlockScore = bodies.filter(b => b.includes('```')).length / bodies.length;

  const structureScore =
    bodies.filter(b => /^\s*[-*]\s/m.test(b) || /^\s*\d+\.\s/m.test(b)).length /
    bodies.length;

  const countScore = Math.min(bodies.length / 20, 1); // saturates at 20 comments

  return 0.3 * lengthScore + 0.3 * codeBlockScore + 0.2 * structureScore + 0.2 * countScore;
}

// --- breadth (0.15) ---
// Combines distinct area count with Shannon entropy — so spread beats concentration.
export function computeBreadth(data: EngineerData): number {
  if (data.authoredPRs.length === 0) return 0;

  const areaCounts = new Map<string, number>();

  for (const pr of data.authoredPRs) {
    const areas = new Set(pr.files.nodes.map(f => pathToArea(f.path)));
    for (const area of areas) {
      areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1);
    }
  }

  if (areaCounts.size === 0) return 0;

  const total = Array.from(areaCounts.values()).reduce((s, n) => s + n, 0);
  let entropy = 0;
  for (const count of areaCounts.values()) {
    const p = count / total;
    entropy -= p * Math.log(p);
  }

  const maxEntropy = Math.log(areaCounts.size);
  const normalizedEntropy = maxEntropy > 0 ? entropy / maxEntropy : 0;

  // 6+ distinct areas = max area-count score
  const areaCountScore = Math.min(areaCounts.size / 6, 1);

  return 0.6 * areaCountScore + 0.4 * normalizedEntropy;
}
