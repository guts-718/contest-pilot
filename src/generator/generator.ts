import { DSLNode } from "./dslParser";
import "./handlers";
import { generateFromDSL } from "./engine";

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

export function generateInput(nodes: any[]) {
  return generateFromDSL(nodes);
}