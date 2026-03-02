// npx ts-node src/generator/dslParser.ts


// <identifier> : <definition>
// n: int[1,5]
// arr: array[n] int[1,10]

export interface DSLNode {
  kind: string;
  name: string;
  params: string[];
  meta?: Record<string, any>;
}

export interface DSLParseResult {
  nodes: DSLNode[];
  errors: string[];
}

// export function parseDSL(text: string): DSLParseResult {
//   const lines = text
//     .split("\n")
//     .map(l => l.trim())
//     .filter(Boolean);

//   const nodes: DSLNode[] = [];
//   const errors: string[] = [];

//   for (let i = 0; i < lines.length; i++) {
//     const line = lines[i];

//     if (!line.includes(":")) {
//       errors.push(`Line ${i + 1}: Missing ':'`);
//       continue;
//     }

//     const [namePart, defPart] = line.split(":");

//     const name = namePart.trim();
//     const def = defPart.trim();

//     if (!/^[a-zA-Z_]\w*$/.test(name)) {
//       errors.push(`Line ${i + 1}: Invalid variable name '${name}'`);
//       continue;
//     }

//     // ---------- INT ----------
//     const intMatch = def.match(/^int\[(.+?),(.+?)\]$/);

//     if (intMatch) {
//     const [, min, max] = intMatch;

//     nodes.push({
//         kind: "int",
//         name,
//         min: min.trim(),
//         max: max.trim()
//     });

//     continue;
//     }
//    //errors.push(`Line ${i + 1}: Invalid definition '${def}'`);
//     // ---------- ARRAY ----------
//     const arrMatch = def.match(/^array\[(.+?)\]\s+int\[(.+?),(.+?)\]$/);

//     if (arrMatch) {
//     const [, size, min, max] = arrMatch;

//     nodes.push({
//         kind: "array",
//         name,
//         size: size.trim(),
//         min: min.trim(),
//         max: max.trim()
//     });

//     continue;
//     }

//     // ---------- STRING ----------
//     const strMatch = def.match(/^string\[(.+?),(.+?)\]\s+(lowercase|uppercase|digits)$/);

//     if (strMatch) {
//     const [, min, max, charset] = strMatch;

//     nodes.push({
//         kind: "string",
//         name,
//         min: min.trim(),
//         max: max.trim(),
//         charset
//     });

//     continue;
//     }

//     // permutation[n]
//     const permMatch = line.match(/^(\w+):\s*permutation\[(\w+)\]$/);

//     if (permMatch) {
//       const [, name, size] = permMatch;

//       nodes.push({
//         kind: "permutation",
//         name,
//         size
//       });

//       continue;
//     }
//   }

//   return { nodes, errors };
// }

export function parseDSL(dsl: string) {
  const nodes: DSLNode[] = [];

  const lines = dsl
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  for (const line of lines) {

    const [left, right] = line.split(":").map(s => s.trim());
    if (!left || !right) continue;

    const name = left;

    const match = right.match(/^(\w+)\[(.*?)\](.*)$/);

    if (!match) continue;

    const [, kind, paramStr, rest] = match;

    const params = paramStr
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);

    const meta: Record<string, any> = {};

    if (rest?.trim()) {
      meta.extra = rest.trim();
    }

    nodes.push({
      kind,
      name,
      params,
      meta
    });
  }

  return { nodes };
}


// console.log(parseDSL(`
// n int[1,5]
// arr: array[n] int[1,10]
// `));

// console.log(parseDSL(`
// n: int[1,5]
// `))

// console.log(parseDSL(`n: integer[1,5]`))


// console.log(parseDSL(`n: int[1,5]
// arr: array[n] int[1,10]
// s: string[1,10] lowercase`))
