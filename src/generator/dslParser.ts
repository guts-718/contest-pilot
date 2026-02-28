// npx ts-node src/generator/dslParser.ts


// <identifier> : <definition>
// n: int[1,5]
// arr: array[n] int[1,10]

export type DSLNode =
  | { kind: "int"; name: string; min: string; max: string }
  | { kind: "array"; name: string; size: string; min: string; max: string }
  | { kind: "string"; name: string; min: string; max: string; charset: string };

export interface DSLParseResult {
  nodes: DSLNode[];
  errors: string[];
}

export function parseDSL(text: string): DSLParseResult {
  const lines = text
    .split("\n")
    .map(l => l.trim())
    .filter(Boolean);

  const nodes: DSLNode[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (!line.includes(":")) {
      errors.push(`Line ${i + 1}: Missing ':'`);
      continue;
    }

    const [namePart, defPart] = line.split(":");

    const name = namePart.trim();
    const def = defPart.trim();

    if (!/^[a-zA-Z_]\w*$/.test(name)) {
      errors.push(`Line ${i + 1}: Invalid variable name '${name}'`);
      continue;
    }

    // ---------- INT ----------
    const intMatch = def.match(/^int\[(.+?),(.+?)\]$/);

    if (intMatch) {
    const [, min, max] = intMatch;

    nodes.push({
        kind: "int",
        name,
        min: min.trim(),
        max: max.trim()
    });

    continue;
    }
   //errors.push(`Line ${i + 1}: Invalid definition '${def}'`);
    // ---------- ARRAY ----------
    const arrMatch = def.match(/^array\[(.+?)\]\s+int\[(.+?),(.+?)\]$/);

    if (arrMatch) {
    const [, size, min, max] = arrMatch;

    nodes.push({
        kind: "array",
        name,
        size: size.trim(),
        min: min.trim(),
        max: max.trim()
    });

    continue;
    }

    // ---------- STRING ----------
    const strMatch = def.match(/^string\[(.+?),(.+?)\]\s+(lowercase|uppercase|digits)$/);

    if (strMatch) {
    const [, min, max, charset] = strMatch;

    nodes.push({
        kind: "string",
        name,
        min: min.trim(),
        max: max.trim(),
        charset
    });

    continue;
    }
  }

  return { nodes, errors };
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
