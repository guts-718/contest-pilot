import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { CONFIG } from "../core/config";
import { logger } from "../core/logger";

const execAsync = promisify(exec);

async function isDockerRunning(): Promise<boolean> {
  try {
    await execAsync("docker info");
    return true;
  } catch {
    return false;
  }
}

export interface RunResult {
  stdout: string;
  stderr: string;
  timeMs: number;
}

export async function runInDocker(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  input: string = ""
): Promise<{
  stdout: string;
  stderr: string;
  timeMs: number;
  memoryKB?: number;
  status: "SUCCESS" | "TLE" | "RUNTIME_ERROR" | "COMPILE_ERROR";
}> {
  const id = Date.now() + "-" + Math.random().toString(36).slice(2);
  const dir = path.join(CONFIG.EXECUTION.TMP_DIR, id);

  await fs.mkdir(dir, { recursive: true });

  const filename = language === "cpp" ? "main.cpp" : "main.py";
  const filepath = path.join(dir, filename);
  const inputPath = path.join(dir, "input.txt");

  await fs.writeFile(filepath, code);
  await fs.writeFile(inputPath, input);

  const image =
    language === "cpp" ? CONFIG.DOCKER.CPP_IMAGE : CONFIG.DOCKER.PY_IMAGE;

  try {
    //  Compile Phase C++  
    if (language === "cpp") {
      const compileCmd =
        `docker run --rm -v "${dir}:/app" ${image} ` +
        `sh -c "g++ -O2 -std=c++17 main.cpp -o main"`;

      try {
        await execAsync(compileCmd);
      } catch (err: any) {
        return {
          stdout: "",
          stderr: err.stderr || "Compilation failed",
          timeMs: 0,
          status: "COMPILE_ERROR"
        };
      }
    }

    //  Run Phase 
    const runCmd =
      language === "cpp"
        ? `sh -c "/usr/bin/time -v ./main < input.txt"`
        : `sh -c "python3 main.py < input.txt"`;

    const cmd =
      `docker run --rm -m ${limits.memoryMB}m --cpus=1 ` +
      `-v "${dir}:/app" ${image} ${runCmd}`;

    const start = Date.now();

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: limits.timeMs
    });

   const memMatch = stderr.match(/Maximum resident set size.*: (\d+)/);

    const memoryKB = memMatch ? Number(memMatch[1]) : 0;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      timeMs: Date.now() - start,
      memoryKB,
      status: "SUCCESS"
    };
  } catch (err: any) {
    if (err.killed) {
      return {
        stdout: "",
        stderr: "Time Limit Exceeded",
        timeMs: limits.timeMs,
        status: "TLE"
      };
    }

    return {
      stdout: err.stdout?.trim() || "",
      stderr: err.stderr?.trim() || "Runtime Error",
      timeMs: 0,
      status: "RUNTIME_ERROR"
    };
  }
}


// import { exec } from "child_process";
// import { promisify } from "util";
// import fs from "fs/promises";
// import path from "path";
// import { CONFIG } from "../core/config";
// import { logger } from "../core/logger";

// const execAsync = promisify(exec);

// export interface RunResult {
//   stdout: string;
//   stderr: string;
//   timeMs: number;
// }
// export async function runInDocker(
//   code: string,
//   language: "cpp" | "python",
//   limits: { timeMs: number; memoryMB: number },
//   input: string = ""
// ): Promise<RunResult & { status: string }> {
//   const id = Date.now() + "-" + Math.random().toString(36).slice(2);
//   const dir = path.join(CONFIG.EXECUTION.TMP_DIR, id);

//   await fs.mkdir(dir, { recursive: true });

//   const filename = language === "cpp" ? "main.cpp" : "main.py";
//   const filepath = path.join(dir, filename);

//   await fs.writeFile(filepath, code);

//   const inputPath = path.join(dir, "input.txt");
//   await fs.writeFile(inputPath, input);

//   const image =
//     language === "cpp" ? CONFIG.DOCKER.CPP_IMAGE : CONFIG.DOCKER.PY_IMAGE;

// const runCmd =
//   language === "cpp"
//     ? `sh -c "g++ -O2 -std=c++17 main.cpp -o main && ./main < input.txt"`
//     : `sh -c "python3 main.py < input.txt"`;

//     const cmd =
//     `docker run --rm -m ${limits.memoryMB}m --cpus=1 ` +
//     `-v "${dir}:/app" ` +
//     `${image} ${runCmd}`;
//     logger.info("docker", cmd);

//   const start = Date.now();

//   try {
//     const { stdout, stderr } = await execAsync(cmd, {
//       timeout: limits.timeMs
//     });
//     logger.info("docker", `stdout=${stdout} stderr=${stderr}`);
//     return {
//       stdout: stdout.trim(),
//       stderr,
//       timeMs: Date.now() - start,
//       status: "SUCCESS"
//     };
//   } catch (err: any) {
//     if (err.killed) {
//       return {
//         stdout: "",
//         stderr: "Time Limit Exceeded",
//         timeMs: limits.timeMs,
//         status: "TLE"
//       };
//     }

//     return {
//       stdout: err.stdout ?? "",
//       stderr: err.stderr ?? err.message,
//       timeMs: Date.now() - start,
//       status: "RUNTIME_ERROR"
//     };
//   }
// }