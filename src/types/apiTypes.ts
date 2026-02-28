export type Language = "cpp" | "python";
import { StressResult } from "../stress/stressRunner";
export interface AnalyzeRequest {
  code: string;
  language: Language;
  problemText?: string;
  url?: string;
  limits?: ProblemLimits;
  samples?: {
    input: string;
    output: string;
  }[];
}

export interface TestResult {
  id: number;
  status: "PASS" | "FAIL" | "ERROR";
  timeMs?: number;
  memoryMB?: number;
  diff?: string;
}


export interface AnalyzeResponse {
  complexity: string;
  constraintRisk: "LOW" | "MEDIUM" | "HIGH";
  recursionDetected: boolean;
  runtimeStatus: "SUCCESS" | "TLE" | "RUNTIME_ERROR" | "COMPILE_ERROR";
  execTimeMs?: number;
  memoryMB?: number;
  tests?: TestResult[];
  warnings: string[];
  stress?: StressResult
}

export interface ProblemLimits {
  timeMs?: number;
  memoryMB?: number;
}