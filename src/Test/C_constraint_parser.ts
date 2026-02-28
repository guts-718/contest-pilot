// npx ts-node .\src\Test\C_constraint_parser.ts
import { extractConstraints } from "../parser/constraintParser";

console.log(
  extractConstraints(`
1 <= n <= 200000
-1e9 <= ai <= 1e9
array is permutation of 1..n
`)
);