import { DSLNode } from "../generator/dslParser";

export type ProblemPattern =
  | "ARRAY"
  | "DUAL_ARRAY"
  | "STRING"
  | "MATRIX"
  | "TREE"
  | "GRAPH"
  | "UNKNOWN";

export function detectPattern(
  dslNodes: DSLNode[],
  problemText?: string
): ProblemPattern {

  const text = (problemText || "").toLowerCase();

  const arrays = dslNodes.filter(n => n.kind === "array").length;
  const strings = dslNodes.filter(n => n.kind === "string").length;

  // ---------- TEXT SIGNALS ----------
  if (text.includes("tree")) return "TREE";
  if (text.includes("graph") || text.includes("edges")) return "GRAPH";
  if (text.includes("matrix") || text.includes("grid")) return "MATRIX";
  if (text.includes("string")) return "STRING";

  // ---------- STRUCTURE SIGNALS ----------
  if (strings > 0) return "STRING";
  if (arrays >= 2) return "DUAL_ARRAY";
  if (arrays === 1) return "ARRAY";

  return "UNKNOWN";
}