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

export async function detectEmpiricalComplexity(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  dslNodes: DSLNode[],
  problemText?: string
) {

  const pattern = detectPattern(dslNodes, problemText);
  const candidates = getCandidates(pattern);

  // detect dominant size variable (largest int range)
  const sizeVars = dslNodes.filter(n => n.kind === "int");

  if (sizeVars.length === 0) {
    return { complexity: "UNKNOWN", confidence: 0 };
  }

  const dominant = sizeVars[0]; // simple v1 (fallback rule)

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

    const res = await runInDocker(code, language, limits, input);

    if (res.status !== "SUCCESS") break;

    samples.push({
      n: currentSize,
      time: res.timeMs
    });

    currentSize *= 2; // exponential scaling
  }

  if (samples.length < 3) {
    return { complexity: "UNKNOWN", confidence: 0 };
  }

  return fitComplexity(samples, candidates);
}