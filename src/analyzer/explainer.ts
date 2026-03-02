interface SweepCase {
  case: string;
  status: string;
}

export function explainFailure(
  sweep: SweepCase[] | null,
  complexity?: string
) {

  if (!sweep || sweep.length === 0)
    return null;

  const failed = sweep.filter(x => x.status !== "PASS" && x.status !== "SUCCESS");

  if (failed.length === 0)
    return null;

  const cases = new Set(failed.map(x => x.case));
  const statuses = new Set(failed.map(x => x.status));

  // ---------- RULES ----------

  if (cases.has("max") && statuses.has("TLE")) {
    return {
      reason: "Likely high time complexity failing on large inputs",
      confidence: 0.85
    };
  }

  if (cases.has("worst") && statuses.has("TLE")) {
    return {
      reason: "Algorithm likely has poor worst-case complexity",
      confidence: 0.8
    };
  }

  if (cases.has("min") && statuses.has("RUNTIME_ERROR")) {
    return {
      reason: "Edge case bug for small inputs (index or division issue)",
      confidence: 0.82
    };
  }

  if (statuses.has("WA") && cases.has("sorted")) {
    return {
      reason: "Logic depends on ordering — fails on sorted input",
      confidence: 0.77
    };
  }

  if (statuses.has("WA") && cases.has("alt")) {
    return {
      reason: "Likely sign or parity logic bug",
      confidence: 0.72
    };
  }

  if (statuses.has("WA") && cases.has("max")) {
    return {
      reason: "Possible overflow or constraint edge issue",
      confidence: 0.74
    };
  }

  if (statuses.has("RUNTIME_ERROR")) {
    return {
      reason: "Runtime error detected — likely invalid memory access or divide by zero",
      confidence: 0.7
    };
  }

  if (statuses.has("TLE") && complexity?.includes("n^2")) {
    return {
      reason: "Quadratic complexity likely exceeding limits",
      confidence: 0.78
    };
  }

  return {
    reason: "Failure detected but cause unclear",
    confidence: 0.4
  };
}