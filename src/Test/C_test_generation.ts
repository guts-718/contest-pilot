import { parseDSL } from "../generator/dslParser";
import { generateInput } from "../generator/generator";

// const spec = `
// n: int[1,5]
// arr: array[n] int[1,10]
// `;

const spec = `
n: int[5,5]
p: permutation[n]
`;
const ast = parseDSL(spec);
console.log(generateInput(ast.nodes));