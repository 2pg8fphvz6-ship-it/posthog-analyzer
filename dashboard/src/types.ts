export interface DimensionScores {
  codeImpact: number;
  contribution: number;
  reliability: number;
  quality: number;
  breadth: number;
}

export interface EngineerMetrics {
  prsMerged: number;
  linesChanged: number;
  prsByType: Record<string, number>;
  reviewsGiven: number;
  inlineReviewComments: number;
  reviewsApproved: number;
  reviewsChangesRequested: number;
  reviewsCommented: number;
  codePRsTotal: number;
  codePRsWithTests: number;
  commentsAuthored: number;
  avgCommentLength: number;
  commentsWithCodeBlocks: number;
  areasCount: number;
  areas: string[];
}

export interface EngineerScore {
  login: string;
  impact: number;
  prCount: number;
  dimensions: DimensionScores;
  metrics: EngineerMetrics;
}

export interface ScoresPayload {
  generatedAt: string;
  fetchedAt: string;
  days: number;
  prCount: number;
  engineerCount: number;
  weights: DimensionScores;
  engineers: EngineerScore[];
}
