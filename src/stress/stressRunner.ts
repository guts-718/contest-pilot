import { DSLNode } from "../generator/dslParser";
import { generateInput } from "../generator/generator";
import { runInDocker } from "../executor/dockerRunner";
import { language } from "tree-sitter-cpp";

export interface StressResult {
  runs: number;
  avgMs: number;
  maxMs: number;
  errors: number;
  tleCount: number;
  firstFailureInput?: string;
}


export async function runStress(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  nodes: DSLNode[],
  maxDurationMs = 3000,
  minRuns = 25
): Promise<StressResult> {
  const start = Date.now();

  const dataset: string[] = [];

  // ---------- DATASET BUILD ----------
  while (
    dataset.length < minRuns ||
    Date.now() - start < maxDurationMs
  ) {
    let p=generateInput(nodes);
    console.log("p: ",p);
    dataset.push(p);
  }

  // ---------- EXECUTION ----------
  let runs = 0;
  let total = 0;
  let max = 0;
  let errors = 0;
  let tleCount = 0;
  let firstFailureInput: string | undefined;

  for (const input of dataset) {
    const res = await runInDocker(code, language, limits, input);

    runs++;
    total += res.timeMs;
    max = Math.max(max, res.timeMs);

    if (res.status === "TLE") tleCount++;

    if (res.status !== "SUCCESS") {
      errors++;
      if (!firstFailureInput) firstFailureInput = input;
    }
  }

  return {
    runs,
    avgMs: total / runs,
    maxMs: max,
    errors,
    tleCount,
    firstFailureInput
  };
}

