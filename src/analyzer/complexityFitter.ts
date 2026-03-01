import { Complexity } from "./complexityCandidates";

interface Sample {
  n: number;
  time: number;
}

function modelValue(n: number, type: Complexity): number {
  switch (type) {
    case "O(1)": return 1;
    case "O(log n)": return Math.log2(n);
    case "O(n)": return n;
    case "O(n log n)": return n * Math.log2(n);
    case "O(n²)": return n * n;
    case "O(n³)": return n * n * n;
    case "O(n+m)": return n; // fallback approx
    case "O(m log n)": return n * Math.log2(n);
    case "O(mn²)": return n * n * n;
    case "O(nm²)": return n * n * n;
  }
}

function variance(arr: number[]) {
  const avg = arr.reduce((a,b)=>a+b,0)/arr.length;
  return arr.reduce((s,v)=>s+(v-avg)**2,0)/arr.length;
}

export function fitComplexity(
  samples: Sample[],
  candidates: Complexity[]
) {

  let best: Complexity = candidates[0];
  let bestScore = Infinity;

  for (const c of candidates) {
    const ratios = samples.map(s => s.time / modelValue(s.n, c));

    const score = variance(ratios);

    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }

  return {
    complexity: best,
    confidence: 1 / (1 + bestScore)
  };
}