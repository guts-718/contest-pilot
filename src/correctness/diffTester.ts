import { DSLNode } from "../generator/dslParser";
import { generateInput } from "../generator/generator";
import { runInDocker } from "../executor/dockerRunner";

export interface DiffResult {
  verdict: "LIKELY_CORRECT" | "WRONG_ANSWER" | "ERROR";
  testsRun: number;
  failingInput?: string;
  expected?: string;
  actual?: string;
}

export async function runDifferentialTest(
  solutionCode: string,
  bruteCode: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  nodes: DSLNode[],
  maxTests = 5  // ig 50+ is needed here 
): Promise<DiffResult> {
  for (let i = 1; i <= maxTests; i++) {
    const input = generateInput(nodes);

    const brute = await runInDocker(bruteCode, language, limits, input);

    if (brute.status !== "SUCCESS") {
      return {
        verdict: "ERROR",
        testsRun: i,
        failingInput: input
      };
    }

    const sol = await runInDocker(solutionCode, language, limits, input);

    if (sol.status !== "SUCCESS") {
      return {
        verdict: "ERROR",
        testsRun: i,
        failingInput: input
      };
    }

    if (brute.stdout.trim() !== sol.stdout.trim()) {
      return {
        verdict: "WRONG_ANSWER",
        testsRun: i,
        failingInput: input,
        expected: brute.stdout,
        actual: sol.stdout
      };
    }
  }

  return {
    verdict: "LIKELY_CORRECT",
    testsRun: maxTests
  };
}