// for final result to be locally minimal failing input
import { runInDocker } from "../executor/dockerRunner";

export async function shrinkInput(
  input: string,
  solution: string,
  brute: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number }
): Promise<string> {
  let lines = input.split("\n");

  let changed = true;

  while (changed) {
    changed = false;

    for (let i = 0; i < lines.length; i++) {
      const trial = [...lines.slice(0, i), ...lines.slice(i + 1)].join("\n");

      if (!trial.trim()) continue;

      const b = await runInDocker(brute, language, limits, trial);
      const s = await runInDocker(solution, language, limits, trial);

      if (b.stdout.trim() !== s.stdout.trim()) {
        lines.splice(i, 1);
        changed = true;
        break;
      }
    }
  }

  return lines.join("\n");
}