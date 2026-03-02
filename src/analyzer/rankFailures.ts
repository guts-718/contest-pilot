interface Cluster {
  pattern: string;
  cases: string[];
  count: number;
  confidence: number;
}

interface RankedCluster extends Cluster {
  severity: number;
  score: number;
  priority: number;
}

function severityOf(pattern: string): number {

  if (pattern.includes("RUNTIME")) return 5;
  if (pattern.includes("MEMORY")) return 4;
  if (pattern.includes("TLE")) return 3;
  if (pattern.includes("WRONG")) return 2;

  return 1;
}

export function rankFailures(clusters: Cluster[]): RankedCluster[] {

  const ranked = clusters.map(c => {

    const severity = severityOf(c.pattern);
    const score = severity * 10 + c.count;

    return {
      ...c,
      severity,
      score,
      priority: 0
    };
  });

  ranked.sort((a,b)=> b.score - a.score);

  ranked.forEach((r,i)=> r.priority = i+1);

  return ranked;
}