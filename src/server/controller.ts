import { Request, Response } from "express";
import { AnalyzeRequest, AnalyzeResponse } from "../types/apiTypes";
import { runSampleTests } from "../executor/testRunner";
import { CONFIG } from "../core/config";
import { jobQueue } from "../core/jobQueue";

import { extractConstraints } from "../parser/constraintParser";
import { constraintsToDSL } from "../parser/constraintToDSL";
import { parseDSL } from "../generator/dslParser";
import { runStress, StressResult } from "../stress/stressRunner";
import { detectEmpiricalComplexity } from "../analyzer/empiricalRunner";

import {
  getLoopDepth,
  estimateComplexity,
  riskLevel,
  hasRecursion
} from "../analyzer/complexity";

function normalizeCode(code: string) {
  return code.replace(/\r\n/g, "\n");
}

function sanitizeLanguage(lang: string): "cpp" | "python" {
  return lang.trim().toLowerCase() as "cpp" | "python";
}

export async function analyzeHandler(req: Request, res: Response) {
  const body = req.body as AnalyzeRequest;

  if (!body?.code || !body?.language) {
    return res.status(400).json({
      error: "Missing required fields: code, language"
    });
  }

  const language = sanitizeLanguage(body.language);

  const limits = {
    timeMs: body.limits?.timeMs ?? CONFIG.DEFAULT_LIMITS.TIME_MS,
    memoryMB: body.limits?.memoryMB ?? CONFIG.DEFAULT_LIMITS.MEMORY_MB
  };

  try {
    const result = await jobQueue.add(async () => {
      const normalizedCode = normalizeCode(body.code);

      // ---------- STATIC ANALYSIS ----------
      const loopDepth = getLoopDepth(normalizedCode, language);
      const recursion = hasRecursion(normalizedCode);
      const complexity = estimateComplexity(loopDepth, recursion);
      
      //riskLevel(loopDepth: number,n = 1e5,recursive = false)
      const risk = riskLevel(loopDepth,1e5,recursion);

      // ---------- SAMPLE TESTS ----------
      const tests = body.samples?.length
        ? await runSampleTests(normalizedCode, language, limits, body.samples)
        : [];

      // ---------- DSL GENERATION ----------
      let dslNodes: any[] = [];
      let warnings: string[] = [];

      if (body.problemText) {
        const parsed = extractConstraints(body.problemText);

        const dsl = constraintsToDSL(parsed);
        const ast = parseDSL(dsl);

        dslNodes = ast.nodes;

        if (parsed.confidence < 0.7) {
          warnings.push("Low confidence constraint parsing");
        }

        if (parsed.unknownSegments.length) {
          warnings.push("Some constraints could not be parsed");
        }
      }

      // STRESS TEST 
      let stress: StressResult;
      let empirical = null;

      if (dslNodes.length > 0) {
        stress = await runStress(
          normalizedCode,
          language,
          limits,
          dslNodes,
          2000
        );

        // ---------- EMPIRICAL COMPLEXITY ----------
        empirical = await detectEmpiricalComplexity(
          normalizedCode,
          language,
          limits,
          dslNodes,
          body.problemText
        );
      }

      // ---------- RESPONSE ----------
      const response: AnalyzeResponse = {
        complexity,
        constraintRisk: risk,
        recursionDetected: recursion,
        runtimeStatus: "SUCCESS",
        tests,
        warnings,
        stress,
        empiricalComplexity: empirical,
      };

      return response;
    });

    res.json(result);

  } catch (err: any) {
    console.error("Analyze error:", err);

    res.status(500).json({
      error: "Internal analysis error",
      details: err.message
    });
  }
}