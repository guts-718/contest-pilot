import { runInDocker } from "../executor/dockerRunner";

export async function minimizeInput(
  input: string,
  code: string,
  bruteCode: string | undefined,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number }
) {

  if (!bruteCode) return input;

  const originalLines = input.trim().split("\n");

  async function fails(testInput: string) {
    const brute = await runInDocker(bruteCode!, language, limits, testInput);
    if (brute.status !== "SUCCESS") return false;

    const sol = await runInDocker(code, language, limits, testInput);
    if (sol.status !== "SUCCESS") return true;

    return sol.stdout.trim() !== brute.stdout.trim();
  }

  let lines = [...originalLines];
  let chunkSize = Math.floor(lines.length / 2);

  while (chunkSize >= 1) {
    let reduced = false;

    for (let i = 0; i < lines.length; i += chunkSize) {
      const candidate = lines
        .slice(0, i)
        .concat(lines.slice(i + chunkSize))
        .join("\n");

      if (await fails(candidate)) {
        lines = candidate.trim().split("\n");
        reduced = true;
        break;
      }
    }

    if (!reduced) {
      chunkSize = Math.floor(chunkSize / 2);
    }
  }

  return lines.join("\n");
}