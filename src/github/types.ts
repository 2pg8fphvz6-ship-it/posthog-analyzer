export interface Actor {
  __typename: string;
  login: string;
}

export interface ReviewComment {
  body: string;
  path: string;
  author: Actor | null;
}

export interface Review {
  author: Actor | null;
  state: 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';
  body: string;
  submittedAt: string;
  comments: {
    nodes: ReviewComment[];
  };
}

export interface PRComment {
  author: Actor | null;
  body: string;
  createdAt: string;
}

export interface PRFile {
  path: string;
}

export interface PullRequest {
  number: number;
  title: string;
  mergedAt: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  author: Actor | null;
  files: { nodes: PRFile[] };
  reviews: { nodes: Review[] };
  comments: { nodes: PRComment[] };
  // Annotated by filters.ts after fetch
  conventionalType?: string;
}
