import { ProblemPattern } from "./patternDetector";

export type Complexity =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n²)"
  | "O(n³)"
  | "O(n+m)"
  | "O(m log n)"
  | "O(mn²)"
  | "O(nm²)";

export function getCandidates(pattern: ProblemPattern): Complexity[] {
  switch (pattern) {

    case "ARRAY":
      return ["O(n)", "O(n log n)", "O(n²)"];

    case "DUAL_ARRAY":
      return ["O(n)", "O(n log n)", "O(n²)"];

    case "STRING":
      return ["O(n)", "O(n log n)", "O(n²)"];

    case "MATRIX":
      return ["O(n²)", "O(n² log n)", "O(n³)",  "O(mn²)", "O(nm²)"] as Complexity[];

    case "TREE":
      return ["O(n)", "O(n log n)", "O(n²)"];

    case "GRAPH":
      return ["O(n+m)", "O(m log n)", "O(n²)"];

    default:
      return ["O(n)", "O(n log n)", "O(n²)"];
  }
}