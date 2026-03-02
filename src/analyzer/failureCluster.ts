interface SweepResult {
  case: string;
  status: string;
  timeMs: number;
}

export interface Cluster {
  pattern: string;
  cases: string[];
  count: number;
  confidence: number;
}

function detectPattern(r: SweepResult): string {

  if (r.status === "TLE") {
    if (r.case === "max") return "TLE_large_input";
    if (r.case === "worst") return "TLE_worst_case";
    return "TLE_general";
  }

  if (r.status === "WA") return "WRONG_ANSWER";

  if (r.status === "RUNTIME_ERROR") return "RUNTIME_ERROR";

  if (r.status === "MLE") return "MEMORY_LIMIT";

  return "OTHER";
}

export function clusterFailures(results: SweepResult[] | null): Cluster[] {

  if (!results || results.length === 0) return [];

  const map = new Map<string, Cluster>();

  for (const r of results) {

    if (r.status === "PASS" || r.status === "SUCCESS")
      continue;

    const key = detectPattern(r);

    if (!map.has(key)) {
      map.set(key, {
        pattern: key,
        cases: [],
        count: 0,
        confidence: 0
      });
    }

    const cluster = map.get(key)!;

    cluster.cases.push(r.case);
    cluster.count++;
  }

  // confidence scoring
  for (const c of map.values()) {
    c.confidence = Math.min(0.5 + c.count * 0.15, 0.95);
  }

  return [...map.values()].sort((a,b)=>b.count-a.count);
}