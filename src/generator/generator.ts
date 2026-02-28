import { DSLNode } from "./dslParser";

type Env = Record<string, number | string | number[]>;

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function resolveValue(expr: string, env: Env): number {
  if (!isNaN(Number(expr))) return Number(expr);

  if (env[expr] !== undefined && typeof env[expr] === "number")
    return env[expr] as number;

  throw new Error(`Unknown reference '${expr}'`);
}

export function generateInput(nodes: DSLNode[]): string {
  const env: Env = {};
  const output: string[] = [];

  for (const node of nodes) {
    // INT
    if (node.kind === "int") {
      const min = resolveValue(node.min, env);
      const max = resolveValue(node.max, env);

      const val = randInt(min, max);
      env[node.name] = val;
      output.push(String(val));
    }

    // ARRAY
    else if (node.kind === "array") {
      const size = resolveValue(node.size, env);
      const min = resolveValue(node.min, env);
      const max = resolveValue(node.max, env);

      const arr: number[] = [];
      for (let i = 0; i < size; i++) {
        arr.push(randInt(min, max));
      }

      env[node.name] = arr;
      output.push(arr.join(" "));
    }

    // STRING
    else if (node.kind === "string") {
      const min = resolveValue(node.min, env);
      const max = resolveValue(node.max, env);

      const len = randInt(min, max);

      let chars = "";
      if (node.charset === "lowercase") chars = "abcdefghijklmnopqrstuvwxyz";
      if (node.charset === "uppercase") chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      if (node.charset === "digits") chars = "0123456789";

      let str = "";
      for (let i = 0; i < len; i++) {
        str += chars[randInt(0, chars.length - 1)];
      }

      env[node.name] = str;
      output.push(str);
    }
  }

  return output.join("\n");
}