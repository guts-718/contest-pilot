import json
import numpy as np

def load_dataset(path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
    return data


def flatten_features(feature_obj):
    flat = []

    # Constraints
    for var in feature_obj["constraints"]["variables"]:
        flat.append(var.get("min", 0))
        flat.append(var.get("max", 0))
        flat.append(var.get("range", 0))

    # Magnitude
    mag = feature_obj["magnitude"]
    flat.extend([
        mag["largestConstraint"],
        mag["logLargestConstraint"],
        mag["quadraticFeasibilityScore"],
        mag["cubicFeasibilityScore"],
        mag["linearRequiredScore"],
        mag.get("densityEstimate", 0)
    ])

    # Structure
    struct = feature_obj["structure"]
    flat.extend([
        int(struct["hasGraph"]),
        int(struct["hasTree"]),
        int(struct["hasPermutation"]),
        int(struct["hasMatrix"]),
        int(struct["hasString"]),
        int(struct["hasQueries"]),
        int(struct["multipleTestCases"])
    ])

    # Output
    out = feature_obj["output"]
    flat.extend([
        out["isDecisionProblem"],
        out["isCountingProblem"],
        out["isOptimizationProblem"],
        out["isConstructiveProblem"],
        out["isPathOutput"]
    ])

    # Interaction
    inter = feature_obj["interactions"]
    flat.extend([
        inter["rangeQueryPressureScore"],
        inter["largeGraphScore"],
        inter["sparseGraphScore"],
        inter["permutationLargeScore"],
        inter["stringAlgorithmPressure"],
        inter["heavyMathScore"]
    ])

    # Keyword category totals only (not individual keywords)
    for val in feature_obj["keywords"]["categories"].values():
        flat.append(val)

    # Keyword normalized densities
    for val in feature_obj["keywords"]["normalized"].values():
        flat.append(val)

    # Stats
    stats = feature_obj["stats"]
    flat.extend([
        stats["statementLength"],
        stats["wordCount"],
        stats["digitCount"],
        stats["inequalityCount"]
    ])

    return np.array(flat, dtype=float)