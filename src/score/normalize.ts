// Converts raw dimension scores to percentile ranks [0, 1] across the cohort.
// Percentile rank is robust to outliers — a single engineer with 10× everyone
// else's codeImpact doesn't compress the entire cohort into a tiny band.
export function normalizeScores<K extends string>(
  engineerScores: Record<string, Record<K, number>>,
  dimensions: K[],
): Record<string, Record<K, number>> {
  const logins = Object.keys(engineerScores);
  const result: Record<string, Record<K, number>> = {};
  for (const login of logins) result[login] = {} as Record<K, number>;

  for (const dim of dimensions) {
    const pairs = logins.map(login => ({ login, val: engineerScores[login][dim] }));
    const sorted = [...pairs].sort((a, b) => a.val - b.val);
    const n = sorted.length;

    sorted.forEach(({ login }, rank) => {
      result[login][dim] = (rank + 1) / n;
    });
  }

  return result;
}
