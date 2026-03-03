import { extractKeywords } from "./keywordExtractor";

interface ConstraintFeature {
  variable: string;
  min?: number;
  max?: number;
  range?: number;
}

interface ConstraintBlock {
  variables: ConstraintFeature[];
  timeLimitMs?: number;
  memoryLimitMB?: number;
}

interface StructureBlock {
  hasGraph: boolean;
  hasTree: boolean;
  hasPermutation: boolean;
  hasMatrix: boolean;
  hasString: boolean;
  hasQueries: boolean;
  multipleTestCases: boolean;
}

interface StatsBlock {
  statementLength: number;
  wordCount: number;
  digitCount: number;
  inequalityCount: number;
}

interface MagnitudeBlock {
  largestConstraint: number;
  logLargestConstraint: number;
  quadraticFeasibilityScore: number;
  cubicFeasibilityScore: number;
  linearRequiredScore: number;
  densityEstimate?: number;
}

interface InteractionBlock {
  rangeQueryPressureScore: number;
  largeGraphScore: number;
  sparseGraphScore: number;
  permutationLargeScore: number;
  stringAlgorithmPressure: number;
  heavyMathScore: number;
}

interface OutputBlock {
  isDecisionProblem: number;
  isCountingProblem: number;
  isOptimizationProblem: number;
  isConstructiveProblem: number;
  isPathOutput: number;
}

export interface FeatureVector {
  constraints: ConstraintBlock;
  structure: StructureBlock;
  stats: StatsBlock;
  keywords: ReturnType<typeof extractKeywords>;
  magnitude: MagnitudeBlock;
  interactions: InteractionBlock;
  output: OutputBlock;
}

function extractConstraints(text: string): ConstraintBlock {
  const variables: ConstraintFeature[] = [];

  const constraintRegex = /(\d+)\s*<=\s*([a-zA-Z]+)\s*<=\s*(\d+)/g;
  let match;

  while ((match = constraintRegex.exec(text)) !== null) {
    const min = Number(match[1]);
    const variable = match[2];
    const max = Number(match[3]);

    variables.push({
      variable,
      min,
      max,
      range: max - min
    });
  }

  // time limit
  const timeMatch = text.match(/(\d+)\s*second/);
  const timeLimitMs = timeMatch ? Number(timeMatch[1]) * 1000 : undefined;

  // memory limit
  const memoryMatch = text.match(/(\d+)\s*MB/i);
  const memoryLimitMB = memoryMatch ? Number(memoryMatch[1]) : undefined;

  return {
    variables,
    timeLimitMs,
    memoryLimitMB
  };
}

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

function extractMagnitude(constraints: ConstraintBlock): MagnitudeBlock {

  const maxValues = constraints.variables
    .map(v => v.max ?? 0);

  const largest = maxValues.length
    ? Math.max(...maxValues)
    : 0;

  const logLargest = largest > 0
    ? Math.log10(largest)
    : 0;

  const quadratic =
    clamp(1 - logLargest / 6, 0, 1);

  const cubic =
    clamp(1 - logLargest / 4, 0, 1);

  const linearRequired =
    clamp(logLargest / 6, 0, 1);

  // density estimate (if n and m both exist)
  const nVar = constraints.variables.find(v => v.variable === "n");
  const mVar = constraints.variables.find(v => v.variable === "m");

  let densityEstimate: number | undefined;

  if (nVar?.max && mVar?.max && nVar.max > 0) {
    densityEstimate =
      mVar.max / (nVar.max * nVar.max);
  }

  return {
    largestConstraint: largest,
    logLargestConstraint: logLargest,
    quadraticFeasibilityScore: quadratic,
    cubicFeasibilityScore: cubic,
    linearRequiredScore: linearRequired,
    densityEstimate
  };
}

function extractInteractions(
  structure: StructureBlock,
  magnitude: MagnitudeBlock,
  keywords: ReturnType<typeof extractKeywords>
): InteractionBlock {

  const largeFactor = magnitude.linearRequiredScore;

  const rangeQueryPressure =
    structure.hasQueries ? largeFactor : 0;

  const largeGraphScore =
    structure.hasGraph ? largeFactor : 0;

  const sparseGraphScore =
    structure.hasGraph && magnitude.densityEstimate !== undefined
      ? 1 - Math.min(magnitude.densityEstimate * 10, 1)
      : 0;

  const permutationLargeScore =
    structure.hasPermutation ? largeFactor : 0;

  const stringAlgorithmPressure =
    structure.hasString ? largeFactor : 0;

  const mathDensity =
    keywords.normalized["math_density"] ?? 0;

  const heavyMathScore =
    mathDensity * magnitude.linearRequiredScore;

  return {
    rangeQueryPressureScore: rangeQueryPressure,
    largeGraphScore,
    sparseGraphScore,
    permutationLargeScore,
    stringAlgorithmPressure,
    heavyMathScore
  };
}

function extractOutputFeatures(text: string): OutputBlock {

  const lower = text.toLowerCase();

  const isDecision =
    lower.includes("print yes") ||
    lower.includes("print no") ||
    lower.includes("yes or no");

  const isCounting =
    lower.includes("number of ways") ||
    lower.includes("count the number") ||
    lower.includes("how many");

  const isOptimization =
    lower.includes("minimum") ||
    lower.includes("maximum") ||
    lower.includes("minimize") ||
    lower.includes("maximize");

  const isConstructive =
    lower.includes("construct") ||
    lower.includes("output any") ||
    lower.includes("print any") ||
    lower.includes("build");

  const isPathOutput =
    lower.includes("print the path") ||
    lower.includes("output the path");

  return {
    isDecisionProblem: isDecision ? 1 : 0,
    isCountingProblem: isCounting ? 1 : 0,
    isOptimizationProblem: isOptimization ? 1 : 0,
    isConstructiveProblem: isConstructive ? 1 : 0,
    isPathOutput: isPathOutput ? 1 : 0
  };
}

function extractStructure(text: string): StructureBlock {
  const lower = text.toLowerCase();

  const hasGraph = lower.includes("graph");
  const hasTree =
    lower.includes("tree") ||
    lower.includes("n-1 edges");

  const hasPermutation = lower.includes("permutation");
  const hasMatrix = lower.includes("matrix") || lower.includes("grid");

  const hasString = lower.includes("string");

  const hasQueries =
    lower.includes("query") ||
    lower.includes("queries");

  const multipleTestCases =
    lower.includes("multiple test cases") ||
    lower.includes("t test cases");

  return {
    hasGraph,
    hasTree,
    hasPermutation,
    hasMatrix,
    hasString,
    hasQueries,
    multipleTestCases
  };
}

function extractStats(text: string): StatsBlock {
  const statementLength = text.length;
  const wordCount = text.split(/\s+/).length;
  const digitCount = (text.match(/\d/g) || []).length;
  const inequalityCount =
    (text.match(/<=|>=|</g) || []).length;

  return {
    statementLength,
    wordCount,
    digitCount,
    inequalityCount
  };
}

export function extractFeatures(problemText: string): FeatureVector {

  const constraints = extractConstraints(problemText);
  const structure = extractStructure(problemText);
  const stats = extractStats(problemText);
  const keywords = extractKeywords(problemText);
  const magnitude = extractMagnitude(constraints);
  const interactions = extractInteractions(structure, magnitude, keywords);

  const output = extractOutputFeatures(problemText);

  return {
    constraints,
    structure,
    stats,
    keywords,
    magnitude,
    interactions,
    output
    };
}