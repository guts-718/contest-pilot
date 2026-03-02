import { DSLNode } from "../generator/dslParser";
import { generateInput } from "../generator/generator";
import { runInDocker } from "../executor/dockerRunner";
import { fitComplexity } from "./complexityFitter";
import { getCandidates } from "./complexityCandidates";
import { detectPattern } from "./patternDetector";

interface Sample {
  n: number;
  time: number;
}

function validateGrowth(samples: { n: number; time: number }[]) {

  if (samples.length < 3) return { ok: false, score: 0 };

  let good = 0;

  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1].time;
    const curr = samples[i].time;

    if (curr >= prev * 0.75) good++;
  }

  const score = good / (samples.length - 1);

  return {
    ok: score >= 0.6,
    score
  };
}

function selectDominantVariable(dslNodes: DSLNode[]) {

  const intVars = dslNodes.filter(n => n.kind === "int");
  if (intVars.length === 0) return null;

  const arrayNodes = dslNodes.filter(n => n.kind === "array");

  let bestVar = intVars[0];
  let bestScore = -Infinity;

  for (const v of intVars) {
    let score = 0;

    // RANGE SIZE 
    const min = Number(v.min);
    const max = Number(v.max);
    if (!isNaN(min) && !isNaN(max)) {
      score += Math.log10(Math.abs(max - min) + 1); // larger range → higher score
    }

    // USED IN ARRAY SIZE 
    const usedInArray = arrayNodes.some(a => a.size === v.name);
    if (usedInArray) score += 8;

    // COMMON SIZE NAMES 
    const name = v.name.toLowerCase();
    if (name === "n") score += 5;
    if (name === "m") score += 4;
    if (name.includes("len") || name.includes("size")) score += 4;

    // MULTIPLE ARRAY USAGE
    const arrayUsageCount = arrayNodes.filter(a => a.size === v.name).length;
    score += arrayUsageCount * 3;

    if (score > bestScore) {
      bestScore = score;
      bestVar = v;
    }
  }

  return bestVar;
}

export async function detectEmpiricalComplexity(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  dslNodes: DSLNode[],
  problemText?: string
) {

  const pattern = detectPattern(dslNodes, problemText);
  const candidates = getCandidates(pattern);

  const dominant = selectDominantVariable(dslNodes);

  if (!dominant) {
    return { complexity: "UNKNOWN", confidence: 0 };
  }
  const samples: Sample[] = [];

  let currentSize = 512;
  const maxSize = 16384;

  while (currentSize <= maxSize) {

    // temporarily override dominant variable range
    const scaledNodes = dslNodes.map(node => {
      if (node.kind === "int" && node.name === dominant.name) {
        return { ...node, min: String(currentSize), max: String(currentSize) };
      }
      return node;
    });

    const input = generateInput(scaledNodes);

    const times: number[] = [];

    for (let i = 0; i < 5; i++) {
      const res = await runInDocker(code, language, limits, input);

      if (res.status !== "SUCCESS") {
        times.length = 0;
        break;
      }

      times.push(res.timeMs);
    }

    if (times.length === 0) break;

    // median
    times.sort((a, b) => a - b);
    const median = times[Math.floor(times.length / 2)];

    samples.push({
      n: currentSize,
      time: median
    });

    currentSize *= 2; // exponential scaling
  }

  if (samples.length < 3) {
    return { complexity: "UNKNOWN", confidence: 0 };
  }

  const growth = validateGrowth(samples);

  if (!growth.ok) {
    return {
      complexity: "UNSTABLE_MEASUREMENTS",
      confidence: growth.score
    };
  }

  const fit = fitComplexity(samples, candidates);

  return {
    complexity: fit.complexity,
    confidence: fit.confidence * growth.score
  };
}