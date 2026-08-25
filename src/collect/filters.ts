import { config } from '../config.js';
import type { Actor, PullRequest } from '../github/types.js';

const CONVENTIONAL_RE =
  /^(feat|fix|perf|refactor|test|docs|chore|build|ci|style)(\(.+\))?!?:/;

export function isBot(actor: Actor | null): boolean {
  if (!actor) return true;
  if (actor.__typename === 'Bot') return true;
  const login = actor.login.toLowerCase();
  if (config.botLogins.has(login)) return true;
  if (login.endsWith('[bot]')) return true;
  return false;
}

export function parseConventionalType(title: string): string | undefined {
  return title.match(CONVENTIONAL_RE)?.[1];
}

// Returns null if the PR should be excluded (bot author or missing author).
// Otherwise returns the PR annotated with its parsed conventional commit type.
export function filterAndAnnotatePR(pr: PullRequest): PullRequest | null {
  if (!pr.author || isBot(pr.author)) return null;
  return { ...pr, conventionalType: parseConventionalType(pr.title) };
}
