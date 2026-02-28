export interface Range {
  min?: number;
  max?: number;
}

export interface ConstraintResult {
  vars: Record<string, Range>;
  confidence: number;
  unknownSegments: string[];
}

function normalize(text: string) {
  return text
    .replace(/≤/g, "<=")
    .replace(/≥/g, ">=")
    .replace(/–/g, "-")
    .replace(/−/g, "-")
    .replace(/×|⋅/g, "*");
}

function parseNumber(v: string): number {
  if (v.includes("e"))
    return Number(v.replace(/e/i, "e"));
  return Number(v);
}

export function extractConstraints(text: string): ConstraintResult {
  const t = normalize(text);

  const vars: Record<string, Range> = {};
  const unknownSegments: string[] = [];

  const lines = t.split("\n").map(l => l.trim()).filter(Boolean);

  for (const line of lines) {

    // 1 <= n <= 100
    let m = line.match(/(-?\d+(?:e\d+)?)\s*<=\s*([a-zA-Z]\w*)\s*<=\s*(-?\d+(?:e\d+)?)/i);
    if (m) {
      const [, min, name, max] = m;
      vars[name] = { min: parseNumber(min), max: parseNumber(max) };
      continue;
    }

    // n <= 100
    m = line.match(/([a-zA-Z]\w*)\s*<=\s*(-?\d+(?:e\d+)?)/);
    if (m) {
      const [, name, max] = m;
      vars[name] = { ...(vars[name]||{}), max: parseNumber(max) };
      continue;
    }

    // n >= 1
    m = line.match(/([a-zA-Z]\w*)\s*>=\s*(-?\d+(?:e\d+)?)/);
    if (m) {
      const [, name, min] = m;
      vars[name] = { ...(vars[name]||{}), min: parseNumber(min) };
      continue;
    }

    // value bounds like ai
    m = line.match(/(-?\d+(?:e\d+)?)\s*<=\s*([a-zA-Z]\w*)\s*<=\s*(-?\d+(?:e\d+)?)/i);
    if (m) continue;

    unknownSegments.push(line);
  }

  const recognized = Object.keys(vars).length;
  const confidence =
    lines.length === 0 ? 0 :
    recognized / lines.length;

  return {
    vars,
    confidence,
    unknownSegments
  };
}