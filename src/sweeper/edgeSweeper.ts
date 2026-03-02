import { DSLNode } from "../generator/dslParser";
import { generateInput } from "../generator/generator";
import { runInDocker } from "../executor/dockerRunner";

interface SweepResult {
  case: string;
  status: string;
  timeMs: number;
}

function clone(nodes: DSLNode[]): DSLNode[] {
  return JSON.parse(JSON.stringify(nodes));
}

function applyMode(nodes: DSLNode[], mode: string) {
  for (const n of nodes) {
    n.meta = n.meta || {};
    n.meta.modifiers = n.meta.modifiers || [];

    n.meta.modifiers.push({ name: "mode", param: mode });
  }
}

export async function runEdgeSweep(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  nodes: DSLNode[],
  bruteCode?: string
) {

  const results: SweepResult[] = [];

  const cases = [
    "min",
    "max",
    "worst",
    "random",
    "alt"
  ];

  for (const c of cases) {
    const testNodes = clone(nodes);

    if (c !== "random")
      applyMode(testNodes, c);

    const input = generateInput(testNodes);
    let status = "SUCCESS";
    let timeMs = 0;

    if (bruteCode) {
    const brute = await runInDocker(bruteCode, language, limits, input);

    if (brute.status !== "SUCCESS") {
        status = "BRUTE_ERROR";
    } else {

        const sol = await runInDocker(code, language, limits, input);

        if (sol.status !== "SUCCESS") {
        status = sol.status;
        } else if (sol.stdout.trim() !== brute.stdout.trim()) {
        status = "WA";
        } else {
        status = "PASS";
        }

        timeMs = sol.timeMs;
    }
    }
    else {
    const sol = await runInDocker(code, language, limits, input);
    status = sol.status;
    timeMs = sol.timeMs;
    }

    results.push({ case: c, status, timeMs });
  }

  return results;
}