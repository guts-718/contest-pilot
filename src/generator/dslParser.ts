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
      const tokens = rest.trim().split(/\s+/);

      meta.extra = tokens.find(t => t.includes("[") && t.includes("int"));
      meta.modifiers = tokens
        .filter(t => t !== meta.extra)
        .map(t => {
          // mode=worst
          const eq = t.match(/^(\w+)=(\w+)$/);
          if (eq) {
            return { name: eq[1], param: eq[2] };
          }

          // boundedDiff[3]
          const br = t.match(/^(\w+)(?:\[(.*?)\])?$/);
          if (br) {
            return { name: br[1], param: br[2] };
          }

          return { name: t };
        });
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

console.log(parseDSL(
  `n: int[6,6]
a: array[n] int[1,10] increasing`
).nodes[1].meta)


console.log(parseDSL(
  `n: int[7,7]
a: array[n] int[1,9] palindrome`
).nodes[1].meta)

console.log(parseDSL(
  `n: int[8,8]
a: array[n] int[1,100] boundedDiff[2]`
).nodes[1].meta)
