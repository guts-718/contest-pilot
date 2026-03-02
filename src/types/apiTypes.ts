export type Language = "cpp" | "python";
import { StressResult } from "../stress/stressRunner";
import { Cluster } from "../analyzer/failureCluster";
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
  bruteCode?: string;
}

export interface explanation{
   reason: string;
   confidence: number;
}

export interface TestResult {
  id: number;
  status: "PASS" | "FAIL" | "ERROR";
  timeMs?: number;
  memoryMB?: number;
  diff?: string;
}

export interface rankedFailures{
  pattern: string;
  priority: number;
  severity: number;
  count: number;
};

export interface AnalyzeResponse {
  complexity: string;
  constraintRisk: "LOW" | "MEDIUM" | "HIGH";
  recursionDetected: boolean;
  runtimeStatus: "SUCCESS" | "TLE" | "RUNTIME_ERROR" | "COMPILE_ERROR";
  execTimeMs?: number;
  memoryMB?: number;
  tests?: TestResult[];
  warnings: string[];
  stress?: StressResult,
  empiricalComplexity?: {
    complexity: string;
    confidence: number;
  };
  explanation?: explanation;
  clusters?: Cluster[];
  rankedFailures: rankedFailures[];
}

export interface ProblemLimits {
  timeMs?: number;
  memoryMB?: number;
}

