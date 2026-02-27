import { runInDocker } from "./dockerRunner";

export interface SampleTest {
  input: string;
  output: string;
}

export interface SampleResult {
  id: number;
  status: "PASS" | "FAIL" | "ERROR";
  timeMs?: number;
  memoryMB?: number;
  diff?: string;
}

export async function runSampleTests(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  samples: SampleTest[]
): Promise<SampleResult[]> {
  const results: SampleResult[] = [];

  for (let i = 0; i < samples.length; i++) {
    const test = samples[i];

    const execResult = await runInDocker(
      code,
      language,
      limits,
      test.input
    );
    console.log("exec_result",i, execResult);

    if (execResult.status !== "SUCCESS") {
      console.log("status of result:i=",i," ", execResult.stderr);
      results.push({
        id: i + 1,
        status: "ERROR",
        timeMs: execResult.timeMs,
        diff: execResult.status
      });
      continue;
    }

    const expected = test.output.trim();
    const actual = execResult.stdout.trim();

    if (expected === actual) {
      results.push({
        id: i + 1,
        status: "PASS",
        timeMs: execResult.timeMs
      });
    } else {
      results.push({
        id: i + 1,
        status: "FAIL",
        timeMs: execResult.timeMs,
        diff: `Expected: ${expected} | Got: ${actual}`
      });
    }
  }

  return results;
}