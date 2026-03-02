import { runInDocker } from "../executor/dockerRunner";

interface Limits {
  timeMs: number;
  memoryMB: number;
}

const MAX_RESULTS = 3;
const MAX_LINES = 20;
const MAX_CHARS = 200;

function isSmallEnough(input: string) {
  return (
    input.length <= MAX_CHARS &&
    input.split("\n").length <= MAX_LINES
  );
}

export async function minimizeInput(
  input: string,
  code: string,
  bruteCode: string | undefined,
  language: "cpp" | "python",
  limits: Limits
): Promise<string[]> {

  if (!bruteCode) return [input];

  const originalLines = input.trim().split("\n");

  async function fails(testInput: string) {
    const brute = await runInDocker(bruteCode!, language, limits, testInput);
    if (brute.status !== "SUCCESS") return false;

    const sol = await runInDocker(code, language, limits, testInput);

    if (sol.status !== "SUCCESS") return true;

    return sol.stdout.trim() !== brute.stdout.trim();
  }

  const found = new Set<string>();

  let lines = [...originalLines];
  let chunkSize = Math.floor(lines.length / 2);

  while (chunkSize >= 1) {
    let reduced = false;

    for (let i = 0; i < lines.length; i += chunkSize) {

      const candidateLines = lines
        .slice(0, i)
        .concat(lines.slice(i + chunkSize));

      if (candidateLines.length === 0) continue;

      const candidate = candidateLines.join("\n");

      if (await fails(candidate)) {

        if (isSmallEnough(candidate)) {
          found.add(candidate.trim());
        }

        lines = candidateLines;
        reduced = true;

        if (found.size >= MAX_RESULTS) break;
      }
    }

    if (found.size >= MAX_RESULTS) break;

    if (!reduced) {
      chunkSize = Math.floor(chunkSize / 2);
    }
  }

  if (found.size === 0)
    return [lines.join("\n")];

  return [...found]
    .sort((a, b) => a.length - b.length)
    .slice(0, MAX_RESULTS);
}