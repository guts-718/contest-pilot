import { Request, Response } from "express";
import { AnalyzeRequest, AnalyzeResponse } from "../types/apiTypes";
import { runSampleTests } from "../executor/testRunner";
import { CONFIG } from "../core/config";
import { jobQueue } from "../core/jobQueue";
import {
  getLoopDepth,
  estimateComplexity,
  riskLevel,
  hasRecursion
} from "../analyzer/complexity";


export async function analyzeHandler(req: Request, res: Response) {
  console.log("request whole: ",req.body);
  const body = req.body as AnalyzeRequest;
  console.log("body: ",body);
  const limits = {
    timeMs: body?.limits?.timeMs ?? CONFIG.DEFAULT_LIMITS.TIME_MS,
    memoryMB: body?.limits?.memoryMB ?? CONFIG.DEFAULT_LIMITS.MEMORY_MB
  };
  
  const result = await jobQueue.add(async () => {
  const loopDepth = getLoopDepth(body.code, body.language);
  const complexity = estimateComplexity(loopDepth);
  const recursion = hasRecursion(body.code);

  const risk = riskLevel(complexity);

  console.log("body.code", JSON.stringify(body.code));
  const normalizedCode = body.code.replace(/\r\n/g, "\n");
  console.log("LANG:", JSON.stringify(body.language));
  const tests = body.samples?.length
    ? await runSampleTests(normalizedCode, body.language, limits, body.samples)
    : [];

  const response: AnalyzeResponse = {
    complexity,
    constraintRisk: risk,
    recursionDetected: recursion,
    runtimeStatus: "SUCCESS",
    tests,
    warnings: []
  };

  return response;
  });

  res.json(result);
}