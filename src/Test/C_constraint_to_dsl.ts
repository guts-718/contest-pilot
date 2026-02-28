// npx ts-node .\src\Test\C_constraint_to_dsl.ts

import { extractConstraints } from "../parser/constraintParser";
import { constraintsToDSL } from "../parser/constraintToDSL";

const parsed = extractConstraints(`
1 <= n <= 100
-10 <= ai <= 10
`);

console.log(constraintsToDSL(parsed));