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

export interface FeatureVector {
  constraints: ConstraintBlock;
  structure: StructureBlock;
  stats: StatsBlock;
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
  return {
    constraints: extractConstraints(problemText),
    structure: extractStructure(problemText),
    stats: extractStats(problemText)
  };
}