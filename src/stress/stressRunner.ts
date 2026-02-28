import { DSLNode } from "../generator/dslParser";
import { generateInput } from "../generator/generator";
import { runInDocker } from "../executor/dockerRunner";
import { language } from "tree-sitter-cpp";

export interface StressResult {
  runs: number;
  avgMs: number;
  maxMs: number;
  maxMemoryKB: number;
  errors: number;
  tleCount: number;
  firstFailureInput?: string;
}


export async function runStress(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  nodes: DSLNode[],
  maxDurationMs = 2000,
  minRuns = 5
): Promise<StressResult> {
  const start = Date.now();

  const dataset: string[] = [];

  // ---------- DATASET BUILD ----------
  /*
  -- below lines should be replace with this ;;;
   dataset.length < minRuns ||
    Date.now() - start < maxDurationMs
    */
  while (
    dataset.length < minRuns &&
    Date.now() - start < maxDurationMs
  ) {

    let p=generateInput(nodes);
    console.log("p: ",p);
    dataset.push(p);
    // dataset.push(generateInput(nodes));
  }

  // ---------- EXECUTION ----------
  let runs = 0;
  let total = 0;
  let max = 0;
  let errors = 0;
  let tleCount = 0;
  let maxMemory = 0;
  let firstFailureInput: string | undefined;

  for (const input of dataset) {
    const res = await runInDocker(code, language, limits, input);
    if (res.memoryKB) maxMemory = Math.max(maxMemory, res.memoryKB);
    runs++;
    total += res.timeMs;
    max = Math.max(max, res.timeMs);

    if (res.status === "TLE") tleCount++;

    if (res.status !== "SUCCESS") {
      console.log("RES: ", res);
      errors++;
      if (!firstFailureInput) firstFailureInput = input;
    }
  }

  return {
    runs,
    avgMs: total / runs,
    maxMs: max,
    maxMemoryKB: maxMemory,
    errors,
    tleCount,
    firstFailureInput
  };
}

