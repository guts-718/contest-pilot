import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs/promises";
import path from "path";
import { CONFIG } from "../core/config";
import { logger } from "../core/logger";
import { getHash, getCached, setCached } from "./compileCache";
import crypto from "crypto";

const execAsync = promisify(exec);

const COMPILE_CACHE_DIR = path.join(CONFIG.EXECUTION.TMP_DIR, "compile-cache");

async function ensureCacheDir() {
  await fs.mkdir(COMPILE_CACHE_DIR, { recursive: true });
}

export async function isDockerRunning(): Promise<boolean> {
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
  memoryKB?: number;
  status: "SUCCESS" | "TLE" | "RUNTIME_ERROR" | "COMPILE_ERROR";
}

export async function runInDocker(
  code: string,
  language: "cpp" | "python",
  limits: { timeMs: number; memoryMB: number },
  input = ""
): Promise<RunResult> {

  await ensureCacheDir();

  const id = Date.now() + "-" + Math.random().toString(36).slice(2);
  const dir = path.join(CONFIG.EXECUTION.TMP_DIR, id);

  await fs.mkdir(dir, { recursive: true });

  const filename = language === "cpp" ? "main.cpp" : "main.py";
  const filepath = path.join(dir, filename);
  const inputPath = path.join(dir, "input.txt");

  await fs.writeFile(filepath, code);
  await fs.writeFile(inputPath, input);

  const image =
    language === "cpp"
      ? CONFIG.DOCKER.CPP_IMAGE
      : CONFIG.DOCKER.PY_IMAGE;

  try {
    // COMPILE PHASE (C++)
    let binaryPath = path.join(dir, "main");

    if (language === "cpp") {
      const hash = getHash(code, language);
      const cachedBinary = path.join(COMPILE_CACHE_DIR, hash);

      try {
        await fs.access(cachedBinary);
        // cache hit → copy binary
        await fs.copyFile(cachedBinary, binaryPath);
      } catch {
        // cache miss → compile
        const compileCmd =
          `docker run --rm -v "${dir}:/app" ${image} ` +
          `sh -c "g++ -O2 -std=c++17 main.cpp -o main"`;

        try {
          await execAsync(compileCmd);
          await fs.copyFile(binaryPath, cachedBinary);
        } catch (err: any) {
          return {
            stdout: "",
            stderr: err.stderr || "Compilation failed",
            timeMs: 0,
            status: "COMPILE_ERROR"
          };
        }
      }
    }

    // RUN PHASE
    const runCmd =
      language === "cpp"
        ? `sh -c "/usr/bin/time -v ./main < input.txt"`
        : `sh -c "python3 main.py < input.txt"`;

    const cmd =
      `docker run --rm -m ${limits.memoryMB}m --cpus=1 ` +
      `-v "${dir}:/app" ${image} ${runCmd}`;

    // warmup run (to ignore the warmup time)
    // without warmup the first run would be slower than the rest
    // with warmup we ignore the fast, so that average isn't inflated
    try {
      await execAsync(cmd, { timeout: limits.timeMs });
      console.log("warmup run done");
    } catch {
      // ignoring warmup failures
    }
    const start = Date.now();

    const { stdout, stderr } = await execAsync(cmd, {
      timeout: limits.timeMs
    });

    const elapsed = Date.now() - start;

    // parse memory
    const memMatch = stderr.match(/Maximum resident set size.*: (\d+)/);
    const memoryKB = memMatch ? Number(memMatch[1]) : undefined;

    return {
      stdout: stdout.trim(),
      stderr: stderr.trim(),
      timeMs: elapsed,
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

