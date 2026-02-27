import { parseCode } from "./astParser";

export function getLoopDepth(code: string, lang: "cpp" | "python"): number {
  const tree = parseCode(code, lang);

  let maxDepth = 0;

  function dfs(node: any, depth: number) {
    if (node.type.includes("for") || node.type.includes("while")) {
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    }

    for (const child of node.children) {
      dfs(child, depth);
    }
  }

  dfs(tree.rootNode, 0);
  return maxDepth;
}

export function hasRecursion(code: string): boolean {
  const match = code.match(/(\w+)\s*\([^)]*\)\s*{[^}]*\1\s*\(/s);
  return !!match;
}

export function estimateComplexity(loopDepth: number): string {
  if (loopDepth === 0) return "O(1)";
  if (loopDepth === 1) return "O(n)";
  if (loopDepth === 2) return "O(n^2)";
  if (loopDepth === 3) return "O(n^3)";
  return "O(n^" + loopDepth + ")";
}

export function riskLevel(complexity: string, n = 1e5): "LOW"|"MEDIUM"|"HIGH" {
  if (complexity.includes("n^3")) return "HIGH";
  if (complexity.includes("n^2") && n > 5e4) return "HIGH";
  if (complexity.includes("n^2")) return "MEDIUM";
  return "LOW";
}