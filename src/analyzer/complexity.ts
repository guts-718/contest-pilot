import { parseCode } from "./astParser";

type Complexity =
  | "O(1)"
  | "O(n)"
  | "O(n^2)"
  | "O(n^3)"
  | `O(n^${number})`
  | "O(2^n)"
  | "O(recursive)";

export function getLoopDepth(
  code: string,
  lang: "cpp" | "python"
): number {
  const tree = parseCode(code, lang);
  let maxDepth = 0;

  function dfs(node: any, currentDepth: number) {
    let depth = currentDepth;

    const isLoop =
      node.type === "for_statement" ||
      node.type === "while_statement" ||
      node.type === "for_in_statement"; // python

    if (isLoop) {
      depth += 1;
      maxDepth = Math.max(maxDepth, depth);
    }

    if (!node.children) return;

    for (const child of node.children) {
      dfs(child, depth); // depth only increases if nested
    }
  }

  dfs(tree.rootNode, 0);
  return maxDepth;
}

export function hasRecursion(code: string): boolean {
  // safer: detect function names first
  const functionMatches = [...code.matchAll(/(\w+)\s*\([^)]*\)\s*{/g)];

  for (const match of functionMatches) {
    const fnName = match[1];
    const fnBodyRegex = new RegExp(
      `${fnName}\\s*\\(`,
      "g"
    );

    const bodyStart = match.index ?? 0;
    const body = code.slice(bodyStart);

    if (fnBodyRegex.test(body)) {
      return true;
    }
  }

  return false;
}

export function estimateComplexity(
  loopDepth: number,
  recursive: boolean
): Complexity {
  if (recursive) return "O(recursive)";

  if (loopDepth === 0) return "O(1)";
  if (loopDepth === 1) return "O(n)";
  if (loopDepth === 2) return "O(n^2)";
  if (loopDepth === 3) return "O(n^3)";
  return `O(n^${loopDepth})`;
}

export function riskLevel(
  loopDepth: number,
  n = 1e5,
  recursive = false
): "LOW" | "MEDIUM" | "HIGH" {
  if (recursive) return "HIGH";

  if (loopDepth >= 3) return "HIGH";

  if (loopDepth === 2) {
    if (n > 5e4) return "HIGH";
    return "MEDIUM";
  }

  if (loopDepth === 1 && n > 1e7) return "MEDIUM";

  return "LOW";
}