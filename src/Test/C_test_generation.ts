import { parseDSL } from "../generator/dslParser";
import { generateInput } from "../generator/generator";

// const spec = `
// n: int[1,5]
// arr: array[n] int[1,10]
// `;

/*
distinct sorted constrainted array:

 const spec = `
 n: int[6,6]
 a: array[n] int[1,10] distinct sorted
`;
*/


/*
array permutation: 
const spec = `
    n: int[5,5]
    p: permutation[n]`;
*/


/* 
tree = 

const spec=`
n: int[5,5]
t: tree[n]`
*/

const spec=`
n: int[5,5]
m: int[6,6]
g: graph[n,m]`;
const ast = parseDSL(spec);
console.log(generateInput(ast.nodes));