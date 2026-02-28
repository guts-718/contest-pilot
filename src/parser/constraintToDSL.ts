import { ConstraintResult } from "./constraintParser";

function isSizeVar(name: string) {
  return ["n","m","k","len","size"].includes(name.toLowerCase());
}

function isArrayVal(name: string) {
  return /^[a-z]i$/i.test(name);
}

export function constraintsToDSL(res: ConstraintResult): string {
  const lines: string[] = [];

  let sizeVar: string | null = null;
  let arrayRange: {min:number,max:number}|null = null;

  for (const [name, r] of Object.entries(res.vars)) {

    if (isSizeVar(name)) {
      sizeVar = name;
      lines.push(`${name}: int[${r.min ?? 1},${r.max ?? 1000}]`);
      continue;
    }

    if (isArrayVal(name)) {
      arrayRange = {
        min: r.min ?? 0,
        max: r.max ?? 100
      };
      continue;
    }

    // fallback scalar
    lines.push(`${name}: int[${r.min ?? 0},${r.max ?? 1000}]`);
  }

  if (sizeVar && arrayRange) {
    lines.push(
      `arr: array[${sizeVar}] int[${arrayRange.min},${arrayRange.max}]`
    );
  }

  return lines.join("\n");
}