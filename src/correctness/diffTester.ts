import { DSLNode } from "../generator/dslParser";
import { generateInput } from "../generator/generator";
import { runInDocker } from "../executor/dockerRunner";
import { shrinkInput } from "./shrinker";
import { analyzePattern } from "./patternAnalyzer";

export interface DiffResult {
  verdict: "LIKELY_CORRECT" | "WRONG_ANSWER" | "ERROR";
  testsRun: number;
  failures: number;
  examples?: string[];
  topPatterns?: { pattern: string; confidence: number }[];
}

export async function runDifferentialTest(
  solutionCode: string,
  bruteCode: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  nodes: DSLNode[],
  maxTests = 10,  // 200
  maxFailures = 10 //
): Promise<DiffResult> {
  const failingInputs: string[] = [];

  for (let i = 1; i <= maxTests; i++) {
    const input = generateInput(nodes);
    console.log("input: ",input);

    const brute = await runInDocker(bruteCode, language, limits, input);
    if (brute.status !== "SUCCESS")
      return { verdict: "ERROR", testsRun: i, failures: 0 };

    const sol = await runInDocker(solutionCode, language, limits, input);
    if (sol.status !== "SUCCESS")
      return { verdict: "ERROR", testsRun: i, failures: 0 };

    if (brute.stdout.trim() !== sol.stdout.trim()) {
      failingInputs.push(input);

      if (failingInputs.length >= maxFailures)
        break;
    }
  }

  if (failingInputs.length === 0) {
    return {
      verdict: "LIKELY_CORRECT",
      testsRun: maxTests,
      failures: 0
    };
  }

  //  Pattern Analysis 
  const freq = new Map<string, number>();

  for (const inp of failingInputs) {
    const patterns = analyzePattern(inp);
    for (const p of patterns)
      freq.set(p, (freq.get(p) || 0) + 1);
  }
  for(const [x,y] of freq){
    console.log("x: ",x," y ",y);
  }

  const ranked = [...freq.entries()]
    .map(([pattern, count]) => ({
      pattern,
      confidence: count
    }))
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 2);

  //  Shrink Representative Failures 
  const examples: string[] = [];

  for (let i = 0; i < Math.min(10, failingInputs.length); i++) {
    const shrunk = await shrinkInput(
      failingInputs[i],
      solutionCode,
      bruteCode,
      language,
      limits
    );
    examples.push(shrunk);
  }

  return {
    verdict: "WRONG_ANSWER",
    testsRun: maxTests,
    failures: failingInputs.length,
    examples,
    topPatterns: ranked
  };
}