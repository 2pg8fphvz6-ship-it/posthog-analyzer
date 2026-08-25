import { useEffect, useState } from 'react';
import type { ScoresPayload, EngineerScore, DimensionScores, EngineerMetrics } from './types';

const MOCK_METRICS: EngineerMetrics = {
  prsMerged: 34, linesChanged: 12450, prsByType: { feat: 18, fix: 10, refactor: 4, chore: 2 },
  reviewsGiven: 28, inlineReviewComments: 45, reviewsApproved: 12, reviewsChangesRequested: 9, reviewsCommented: 7,
  codePRsTotal: 28, codePRsWithTests: 20,
  commentsAuthored: 142, avgCommentLength: 187, commentsWithCodeBlocks: 48,
  areasCount: 5, areas: ['Backend', 'Enterprise', 'Frontend', 'Plugin Server', 'HogQL'],
};

const MOCK_DATA: ScoresPayload = {
  generatedAt: new Date().toISOString(),
  fetchedAt: new Date().toISOString(),
  days: 90,
  prCount: 1842,
  engineerCount: 12,
  weights: { codeImpact: 0.30, contribution: 0.20, reliability: 0.20, quality: 0.15, breadth: 0.15 },
  engineers: [
    { login: 'pauldambra',   impact: 0.891, prCount: 34, dimensions: { codeImpact: 0.97, contribution: 0.88, reliability: 0.82, quality: 0.91, breadth: 0.83 }, metrics: { ...MOCK_METRICS, prsMerged: 34, linesChanged: 12450, reviewsGiven: 28, codePRsWithTests: 20, codePRsTotal: 28, areasCount: 5, areas: ['Backend', 'Enterprise', 'Frontend', 'Plugin Server', 'HogQL'] } },
    { login: 'timgl',        impact: 0.847, prCount: 28, dimensions: { codeImpact: 0.91, contribution: 0.79, reliability: 0.95, quality: 0.76, breadth: 0.87 }, metrics: { ...MOCK_METRICS, prsMerged: 28, linesChanged: 9800, reviewsGiven: 19, codePRsWithTests: 22, codePRsTotal: 23, areasCount: 6, areas: ['Backend', 'Frontend', 'Plugin Server', 'Rust', 'HogQL', 'CI/CD'] } },
    { login: 'mariusandra',  impact: 0.801, prCount: 22, dimensions: { codeImpact: 0.85, contribution: 0.93, reliability: 0.71, quality: 0.88, breadth: 0.62 }, metrics: { ...MOCK_METRICS, prsMerged: 22, linesChanged: 8200, reviewsGiven: 34, codePRsWithTests: 11, codePRsTotal: 18, areasCount: 3, areas: ['Frontend', 'Backend', 'Enterprise'] } },
    { login: 'EDsCODE',      impact: 0.754, prCount: 19, dimensions: { codeImpact: 0.78, contribution: 0.65, reliability: 0.88, quality: 0.72, breadth: 0.79 }, metrics: { ...MOCK_METRICS, prsMerged: 19, linesChanged: 6100, reviewsGiven: 14, codePRsWithTests: 14, codePRsTotal: 16, areasCount: 4, areas: ['Backend', 'Enterprise', 'Plugin Server', 'Rust'] } },
    { login: 'zachfeldman',  impact: 0.701, prCount: 17, dimensions: { codeImpact: 0.72, contribution: 0.71, reliability: 0.65, quality: 0.80, breadth: 0.58 }, metrics: { ...MOCK_METRICS, prsMerged: 17, linesChanged: 5400, reviewsGiven: 18, codePRsWithTests: 8,  codePRsTotal: 14, areasCount: 3, areas: ['Frontend', 'Backend', 'HogQL'] } },
    { login: 'neilkakkar',   impact: 0.655, prCount: 15, dimensions: { codeImpact: 0.68, contribution: 0.58, reliability: 0.77, quality: 0.62, breadth: 0.55 }, metrics: { ...MOCK_METRICS, prsMerged: 15, linesChanged: 4800, reviewsGiven: 12, codePRsWithTests: 9,  codePRsTotal: 13, areasCount: 3, areas: ['Backend', 'Enterprise', 'HogQL'] } },
    { login: 'robbie-c',     impact: 0.612, prCount: 13, dimensions: { codeImpact: 0.59, contribution: 0.74, reliability: 0.52, quality: 0.68, breadth: 0.51 }, metrics: { ...MOCK_METRICS, prsMerged: 13, linesChanged: 3900, reviewsGiven: 21, codePRsWithTests: 5,  codePRsTotal: 10, areasCount: 3, areas: ['Frontend', 'Backend', 'E2E Tests'] } },
    { login: 'thmsobrmlr',   impact: 0.571, prCount: 11, dimensions: { codeImpact: 0.55, contribution: 0.49, reliability: 0.71, quality: 0.59, breadth: 0.62 }, metrics: { ...MOCK_METRICS, prsMerged: 11, linesChanged: 3100, reviewsGiven: 9,  codePRsWithTests: 7,  codePRsTotal: 10, areasCount: 4, areas: ['Backend', 'Enterprise', 'HogQL', 'Rust'] } },
    { login: 'Twixes',       impact: 0.524, prCount: 10, dimensions: { codeImpact: 0.48, contribution: 0.61, reliability: 0.48, quality: 0.55, breadth: 0.47 }, metrics: { ...MOCK_METRICS, prsMerged: 10, linesChanged: 2700, reviewsGiven: 14, codePRsWithTests: 4,  codePRsTotal: 9,  areasCount: 3, areas: ['Backend', 'Frontend', 'Enterprise'] } },
    { login: 'benjackwhite', impact: 0.481, prCount:  9, dimensions: { codeImpact: 0.44, contribution: 0.52, reliability: 0.55, quality: 0.41, breadth: 0.53 }, metrics: { ...MOCK_METRICS, prsMerged: 9,  linesChanged: 2200, reviewsGiven: 11, codePRsWithTests: 5,  codePRsTotal: 9,  areasCount: 3, areas: ['Frontend', 'E2E Tests', 'CI/CD'] } },
    { login: 'macobo',       impact: 0.432, prCount:  7, dimensions: { codeImpact: 0.38, contribution: 0.47, reliability: 0.49, quality: 0.45, breadth: 0.39 }, metrics: { ...MOCK_METRICS, prsMerged: 7,  linesChanged: 1800, reviewsGiven: 8,  codePRsWithTests: 3,  codePRsTotal: 7,  areasCount: 2, areas: ['Backend', 'HogQL'] } },
    { login: 'yakkomajuri',  impact: 0.381, prCount:  5, dimensions: { codeImpact: 0.31, contribution: 0.39, reliability: 0.42, quality: 0.38, breadth: 0.44 }, metrics: { ...MOCK_METRICS, prsMerged: 5,  linesChanged: 1200, reviewsGiven: 6,  codePRsWithTests: 2,  codePRsTotal: 5,  areasCount: 3, areas: ['Frontend', 'Backend', 'Plugin Server'] } },
  ],
};

const DIMENSION_LABELS: Record<keyof DimensionScores, string> = {
  codeImpact: 'Code Impact',
  contribution: 'Contribution',
  reliability: 'Reliability',
  quality: 'Quality',
  breadth: 'Breadth',
};

const DIMENSION_COLORS: Record<keyof DimensionScores, string> = {
  codeImpact: '#f97316',
  contribution: '#3b82f6',
  reliability: '#22c55e',
  quality: '#a855f7',
  breadth: '#eab308',
};

const DIMENSIONS_EXPLAINED = [
  {
    dim: 'codeImpact' as const,
    weight: '30%',
    headline: 'Ships meaningful work',
    body: 'Not raw line count — weighted by PR type so a feat: counts more than a chore:, and log-scaled so one giant refactor doesn\'t overshadow consistent delivery.',
  },
  {
    dim: 'contribution' as const,
    weight: '20%',
    headline: 'Actively unblocks others',
    body: 'Impact isn\'t just your own PRs. Reviewing others\' work, especially leaving substantive feedback or blocking a merge until it\'s right, is how senior engineers multiply the team. Change requests score higher than approvals because they represent real investment.',
  },
  {
    dim: 'reliability' as const,
    weight: '20%',
    headline: 'Writes code that holds up',
    body: 'Code that ships without tests is a liability. This measures whether someone consistently brings coverage along with their changes, not just whether they can ship fast.',
  },
  {
    dim: 'quality' as const,
    weight: '15%',
    headline: 'Communicates with substance',
    body: 'How someone engages in discussion matters. Long, structured, code-block-rich comments signal someone who explains their reasoning rather than leaving cryptic one-liners — making the codebase legible to others.',
  },
  {
    dim: 'breadth' as const,
    weight: '15%',
    headline: 'Doesn\'t stay siloed',
    body: 'A preference for generalists over specialists. Engineers who can move across the stack are more valuable to a team than those who stay in one directory. Entropy-weighted so genuine spread scores higher than one area with a brief foray into a second.',
  },
];

function AboutScore({ engineerCount }: { engineerCount: number }) {
  const [open, setOpen] = useState(false);

  return (
    <div style={styles.aboutBox}>
      <button style={styles.aboutToggle} onClick={() => setOpen(o => !o)}>
        <span>What does this score measure?</span>
        <span style={{ color: '#555' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={styles.aboutBody}>
          <p style={styles.aboutLead}>
            An impactful engineer isn't just productive for themselves — they make the team around
            them better. This score is a <strong>weighted average of five percentile ranks</strong>,
            each measuring a different dimension of that impact within the {engineerCount}-engineer
            cohort. A score of <strong>90</strong> means this person ranked higher than 90% of the
            group on that dimension.
          </p>
          <div style={styles.aboutGrid}>
            {DIMENSIONS_EXPLAINED.map(({ dim, weight, headline, body }) => (
              <div key={dim} style={styles.aboutCard}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
                  <span style={{ color: DIMENSION_COLORS[dim], fontWeight: 700, fontSize: 13 }}>
                    {DIMENSION_LABELS[dim]}
                  </span>
                  <span style={{ color: '#444', fontSize: 12 }}>{weight}</span>
                </div>
                <div style={{ color: '#e8e8e8', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
                  {headline}
                </div>
                <div style={{ color: '#666', fontSize: 12, lineHeight: 1.6 }}>{body}</div>
              </div>
            ))}
          </div>
          <p style={{ margin: '12px 0 0', fontSize: 12, color: '#444' }}>
            The through-line: impact = shipping well + helping others ship well.
            Click any row to see the raw numbers behind each score and verify on GitHub.
          </p>
        </div>
      )}
    </div>
  );
}

export function App() {
  const [data, setData] = useState<ScoresPayload | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/scores.json')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<ScoresPayload>;
      })
      .then(setData)
      .catch(() => setData(MOCK_DATA));
  }, []);

  if (!data) {
    return <div style={styles.centered}><p>Loading…</p></div>;
  }

  // Earliest date included in the dataset — used to scope GitHub search links.
  const sinceDate = new Date(
    new Date(data.fetchedAt).getTime() - data.days * 86_400_000
  ).toISOString().slice(0, 10);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.h1}>PostHog Impact Leaderboard</h1>
        <p style={styles.subtitle}>
          {data.engineerCount} engineers · {data.prCount} PRs · last {data.days} days
          <span style={styles.muted}> · generated {new Date(data.generatedAt).toLocaleString()}</span>
        </p>
        <div style={styles.weightRow}>
          {(Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[]).map(dim => (
            <span key={dim} style={{ ...styles.weightChip, borderColor: DIMENSION_COLORS[dim] }}>
              {DIMENSION_LABELS[dim]}&nbsp;
              <strong>{Math.round(data.weights[dim] * 100)}%</strong>
            </span>
          ))}
        </div>
        <AboutScore engineerCount={data.engineerCount} />
      </header>

      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={{ ...styles.th, textAlign: 'left' }}>Engineer</th>
            <th style={styles.th}>Impact score</th>
            <th style={styles.th}>PRs merged</th>
            <th style={{ ...styles.th, width: 320 }}>Dimension breakdown</th>
            <th style={{ ...styles.th, width: 24 }} />
          </tr>
        </thead>
        <tbody>
          {data.engineers.map((eng, i) => (
            <EngineerRow
              key={eng.login}
              rank={i + 1}
              total={data.engineerCount}
              engineer={eng}
              weights={data.weights}
              sinceDate={sinceDate}
              isExpanded={expanded === eng.login}
              onToggle={() => setExpanded(prev => (prev === eng.login ? null : eng.login))}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface RowProps {
  rank: number;
  total: number;
  engineer: EngineerScore;
  weights: Record<keyof DimensionScores, number>;
  sinceDate: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function ScoreTooltip({ engineer, weights }: { engineer: EngineerScore; weights: Record<keyof DimensionScores, number> }) {
  const [visible, setVisible] = useState(false);
  const scoreInt = Math.round(engineer.impact * 100);
  const dims = engineer.dimensions;

  const rows = (Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[]).map(dim => ({
    dim,
    label: DIMENSION_LABELS[dim],
    score: Math.round(dims[dim] * 100),
    weight: weights[dim],
    points: dims[dim] * weights[dim] * 100,
  }));

  return (
    <div
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      <span style={{ fontWeight: 700, fontSize: 20, borderBottom: '1px dashed #444', cursor: 'default' }}>
        {scoreInt}
      </span>
      <span style={{ color: '#444', fontSize: 12 }}> /100</span>
      {visible && (
        <div style={styles.scoreTooltip}>
          <div style={{ color: '#888', fontSize: 11, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #2a2a2a' }}>
            impact = weighted sum of percentile ranks
          </div>
          {rows.map(({ dim, label, score, weight, points }) => (
            <div key={dim} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5 }}>
              <span style={{ color: DIMENSION_COLORS[dim], fontSize: 12, minWidth: 90 }}>{label}</span>
              <span style={{ color: '#aaa', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                {score} <span style={{ color: '#444' }}>×</span> {Math.round(weight * 100)}%
              </span>
              <span style={{ color: '#e8e8e8', fontSize: 12, fontWeight: 600, fontVariantNumeric: 'tabular-nums', minWidth: 30, textAlign: 'right' }}>
                {points.toFixed(1)}
              </span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, borderTop: '1px solid #2a2a2a', marginTop: 2 }}>
            <span style={{ color: '#555', fontSize: 12 }}>Total</span>
            <span style={{ color: '#f97316', fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
              {rows.reduce((s, r) => s + r.points, 0).toFixed(1)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function EngineerRow({ rank, total, engineer, weights, sinceDate, isExpanded, onToggle }: RowProps) {
  const dims = engineer.dimensions;
  const isTop3 = rank <= 3;

  return (
    <>
      <tr
        style={{ ...styles.row, background: isExpanded ? '#1a1a1a' : 'transparent' }}
        onClick={onToggle}
      >
        <td style={{ ...styles.td, color: isTop3 ? '#f97316' : '#666', fontWeight: isTop3 ? 700 : 400 }}>
          {rank}
        </td>
        <td style={styles.td}>
          <a
            href={`https://github.com/${engineer.login}`}
            target="_blank"
            rel="noreferrer"
            style={styles.link}
            onClick={e => e.stopPropagation()}
          >
            <img
              src={`https://github.com/${engineer.login}.png?size=32`}
              width={24}
              height={24}
              style={styles.avatar}
              alt=""
            />
            {engineer.login}
          </a>
        </td>
        <td style={{ ...styles.td, textAlign: 'center' }}>
          <ScoreTooltip engineer={engineer} weights={weights} />
          <div style={{ fontSize: 11, color: '#555', marginTop: 2 }}>
            top {Math.round((1 - (rank - 1) / total) * 100)}% of cohort
          </div>
        </td>
        <td style={{ ...styles.td, textAlign: 'center', color: '#999' }}>{engineer.prCount}</td>
        <td style={styles.td}>
          <DimBars dims={dims} />
        </td>
        <td style={{ ...styles.td, color: '#555', fontSize: 28, userSelect: 'none', textAlign: 'center' }}>
          <span style={{ display: 'inline-block', transition: 'transform 0.2s', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
            ▾
          </span>
        </td>
      </tr>
      {isExpanded && (
        <tr style={{ background: '#1a1a1a' }}>
          <td colSpan={6} style={{ padding: '12px 24px 20px' }}>
            {engineer.metrics
              ? <DimDetail dims={dims} metrics={engineer.metrics} login={engineer.login} sinceDate={sinceDate} />
              : <p style={{ color: '#666', fontSize: 13 }}>Run <code>npm run score</code> to generate metrics.</p>
            }
          </td>
        </tr>
      )}
    </>
  );
}

function DimBars({ dims }: { dims: DimensionScores }) {
  return (
    <div style={{ display: 'flex', gap: 3, alignItems: 'center', height: 20 }}>
      {(Object.keys(DIMENSION_LABELS) as (keyof DimensionScores)[]).map(dim => (
        <div
          key={dim}
          title={`${DIMENSION_LABELS[dim]}: ${(dims[dim] * 100).toFixed(1)}th percentile`}
          style={{
            height: 20,
            width: Math.max(dims[dim] * 56, 2),
            background: DIMENSION_COLORS[dim],
            borderRadius: 3,
            opacity: 0.85,
            transition: 'width 0.3s',
          }}
        />
      ))}
    </div>
  );
}

const REPO = 'PostHog/posthog';

function ghAuthoredPRs(login: string, since: string) {
  return `https://github.com/${REPO}/pulls?q=is:pr+is:merged+author:${login}+merged:>${since}`;
}
// Filters to feat/fix/perf/refactor PRs by title prefix — the "code-bearing" types used for reliability scoring.
function ghCodePRs(login: string, since: string) {
  return `https://github.com/${REPO}/pulls?q=is:pr+is:merged+author:${login}+merged:>${since}+feat+OR+fix+OR+perf+OR+refactor`;
}
function ghReviewedPRs(login: string, since: string) {
  return `https://github.com/${REPO}/pulls?q=is:pr+is:merged+reviewed-by:${login}+merged:>${since}`;
}
function ghComments(login: string, since: string) {
  return `https://github.com/${REPO}/issues?q=commenter:${login}+updated:>${since}`;
}
// Commit history lets you expand individual commits and see which files/areas were touched.
function ghCommits(login: string, since: string) {
  return `https://github.com/${REPO}/commits?author=${login}&since=${since}`;
}

function GhLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" style={styles.ghLink}>
      {label} ↗
    </a>
  );
}

function DimDetail({ dims, metrics, login, sinceDate }: {
  dims: DimensionScores;
  metrics: EngineerMetrics;
  login: string;
  sinceDate: string;
}) {
  const topTypes = Object.entries(metrics.prsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([t, n]) => `${t}: ${n}`)
    .join(' · ');

  const testRate = metrics.codePRsTotal > 0
    ? Math.round((metrics.codePRsWithTests / metrics.codePRsTotal) * 100)
    : 0;

  const topTypeStr = Object.entries(metrics.prsByType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([t, n]) => `${n} ${t}`)
    .join(', ');

  const codeImpactDesc = `Merged ${metrics.prsMerged} PRs touching ${metrics.linesChanged.toLocaleString()} lines${topTypeStr ? ` — mostly ${topTypeStr}` : ''}.`;

  const contributionDesc = metrics.reviewsGiven === 0
    ? 'No reviews given in this window.'
    : `Reviewed ${metrics.reviewsGiven} PRs with ${metrics.inlineReviewComments} inline comments${metrics.reviewsChangesRequested > 0 ? `, including ${metrics.reviewsChangesRequested} change request${metrics.reviewsChangesRequested > 1 ? 's' : ''}` : ''}.`;

  const reliabilityDesc = metrics.codePRsTotal === 0
    ? 'No code-bearing PRs in this window.'
    : `${metrics.codePRsWithTests} of ${metrics.codePRsTotal} code PRs (${testRate}%) included test changes.`;

  const qualityDesc = metrics.commentsAuthored === 0
    ? 'No comments authored in this window.'
    : `Authored ${metrics.commentsAuthored} comments averaging ${metrics.avgCommentLength} chars${metrics.commentsWithCodeBlocks > 0 ? `, ${metrics.commentsWithCodeBlocks} with code blocks` : ''}.`;

  const breadthDesc = metrics.areasCount === 0
    ? 'No distinct areas touched.'
    : `Touched ${metrics.areasCount} area${metrics.areasCount > 1 ? 's' : ''}: ${metrics.areas.join(', ')}.`;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>

      <DimCard dim="codeImpact" dims={dims} description={codeImpactDesc}>
        <Stat label="PRs merged" value={String(metrics.prsMerged)} />
        <Stat label="Lines changed" value={metrics.linesChanged.toLocaleString()} />
        {topTypes && <Stat label="By type" value={topTypes} small />}
        <GhLink href={ghAuthoredPRs(login, sinceDate)} label="View merged PRs" />
      </DimCard>

      <DimCard dim="contribution" dims={dims} description={contributionDesc}>
        <Stat label="Reviews given" value={String(metrics.reviewsGiven)} />
        <Stat label="Inline comments" value={String(metrics.inlineReviewComments)} />
        <Stat label="Change requests" value={String(metrics.reviewsChangesRequested)} small />
        <GhLink href={ghReviewedPRs(login, sinceDate)} label="View reviews given" />
      </DimCard>

      <DimCard dim="reliability" dims={dims} description={reliabilityDesc}>
        <Stat label="Code PRs with tests" value={`${metrics.codePRsWithTests} / ${metrics.codePRsTotal}`} />
        <Stat label="Test inclusion rate" value={metrics.codePRsTotal > 0 ? `${testRate}%` : '—'} />
        <GhLink href={ghCodePRs(login, sinceDate)} label="Browse feat/fix PRs" />
      </DimCard>

      <DimCard dim="quality" dims={dims} description={qualityDesc}>
        <Stat label="Comments authored" value={String(metrics.commentsAuthored)} />
        <Stat label="Avg length" value={`${metrics.avgCommentLength} chars`} />
        <Stat label="Had code blocks" value={String(metrics.commentsWithCodeBlocks)} small />
        <GhLink href={ghComments(login, sinceDate)} label="View comments" />
      </DimCard>

      <DimCard dim="breadth" dims={dims} description={breadthDesc}>
        <Stat label="Areas touched" value={String(metrics.areasCount)} />
        <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
          {metrics.areas.map(a => (
            <span key={a} style={styles.areaChip}>{a}</span>
          ))}
        </div>
        <GhLink href={ghCommits(login, sinceDate)} label="Browse commits by area" />
      </DimCard>

    </div>
  );
}

function DimCard({ dim, dims, description, children }: {
  dim: keyof DimensionScores;
  dims: DimensionScores;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div style={styles.dimCard}>
      <div style={{ color: DIMENSION_COLORS[dim], fontSize: 11, fontWeight: 600 }}>
        {DIMENSION_LABELS[dim].toUpperCase()}
      </div>
      <div style={{ fontSize: 13, color: '#e8e8e8', fontWeight: 600, margin: '2px 0' }}>
        {(dims[dim] * 100).toFixed(0)}
        <span style={{ color: '#555', fontWeight: 400 }}> / 100</span>
      </div>
      <div style={{ height: 4, background: '#2a2a2a', borderRadius: 2, marginBottom: 8 }}>
        <div style={{ height: 4, width: `${dims[dim] * 100}%`, background: DIMENSION_COLORS[dim], borderRadius: 2 }} />
      </div>
      <p style={styles.dimDescription}>{description}</p>
      {children}
    </div>
  );
}

function Stat({ label, value, small = false }: { label: string; value: string; small?: boolean }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <span style={{ color: '#555', fontSize: 11 }}>{label} </span>
      <span style={{ color: '#e8e8e8', fontSize: small ? 12 : 14, fontWeight: small ? 400 : 600 }}>{value}</span>
    </div>
  );
}

const styles = {
  page: {
    maxWidth: 1000,
    margin: '0 auto',
    padding: '32px 24px',
  },
  header: {
    marginBottom: 32,
  },
  h1: {
    margin: '0 0 8px',
    fontSize: 28,
    fontWeight: 700,
    color: '#f97316',
  },
  subtitle: {
    margin: '0 0 16px',
    color: '#ccc',
    fontSize: 14,
  },
  muted: {
    color: '#555',
  },
  weightRow: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap' as const,
  },
  weightChip: {
    padding: '3px 10px',
    borderRadius: 20,
    border: '1px solid',
    fontSize: 12,
    color: '#ccc',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    padding: '8px 12px',
    textAlign: 'center' as const,
    color: '#666',
    fontSize: 11,
    fontWeight: 600,
    textTransform: 'uppercase' as const,
    borderBottom: '1px solid #222',
  },
  row: {
    cursor: 'pointer',
    borderBottom: '1px solid #1a1a1a',
    transition: 'background 0.1s',
  },
  td: {
    padding: '12px 12px',
    verticalAlign: 'middle' as const,
  },
  link: {
    color: '#e8e8e8',
    textDecoration: 'none',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    borderRadius: '50%',
  },
  dimCard: {
    background: '#111',
    borderRadius: 8,
    padding: '12px 14px',
  },
  areaChip: {
    padding: '2px 8px',
    borderRadius: 12,
    background: '#1e1e1e',
    border: '1px solid #333',
    fontSize: 11,
    color: '#aaa',
  },
  methodology: {
    margin: '16px 0 0',
    padding: '12px 16px',
    background: '#111',
    borderRadius: 8,
    border: '1px solid #222',
    fontSize: 13,
    color: '#888',
    lineHeight: 1.6,
  },
  aboutBox: {
    marginTop: 20,
    border: '1px solid #222',
    borderRadius: 8,
    overflow: 'hidden',
  },
  aboutToggle: {
    width: '100%',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#111',
    border: 'none',
    cursor: 'pointer',
    color: '#aaa',
    fontSize: 13,
    textAlign: 'left' as const,
  },
  aboutBody: {
    padding: '0 16px 16px',
    background: '#0d0d0d',
  },
  aboutLead: {
    margin: '16px 0 16px',
    fontSize: 13,
    color: '#888',
    lineHeight: 1.7,
  },
  aboutGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: 10,
  },
  aboutCard: {
    background: '#111',
    borderRadius: 8,
    padding: '12px 14px',
  },
  dimDescription: {
    margin: '0 0 10px',
    fontSize: 11,
    color: '#555',
    lineHeight: 1.5,
  },
  ghLink: {
    display: 'inline-block',
    marginTop: 8,
    fontSize: 11,
    color: '#3b82f6',
    textDecoration: 'none',
  },
  centered: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: 8,
  },
  scoreTooltip: {
    position: 'absolute' as const,
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%)',
    marginTop: 8,
    background: '#161616',
    border: '1px solid #2a2a2a',
    borderRadius: 8,
    padding: '12px 14px',
    minWidth: 230,
    zIndex: 100,
    boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
    pointerEvents: 'none' as const,
  },
} as const;
