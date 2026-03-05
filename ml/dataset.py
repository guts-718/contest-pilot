import json
import numpy as np


# Fixed category order (must match training and inference)
KEYWORD_CATEGORIES = [
    "graph",
    "dp",
    "math",
    "data_structures",
    "queries",
    "greedy",
    "combinatorics"
]


def load_dataset(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def flatten_features(feature_obj):
    flat = []

    # ------------------------------
    # Constraint summary (fixed size)
    # ------------------------------
    variables = feature_obj["constraints"]["variables"]

    max_vals = [v.get("max", 0) for v in variables]
    min_vals = [v.get("min", 0) for v in variables]

    num_vars = len(variables)
    max_constraint = max(max_vals) if max_vals else 0
    min_constraint = min(min_vals) if min_vals else 0
    avg_constraint = sum(max_vals) / len(max_vals) if max_vals else 0

    flat.extend([
        num_vars,
        max_constraint,
        min_constraint,
        avg_constraint
    ])

    # ------------------------------
    # Magnitude features
    # ------------------------------
    mag = feature_obj["magnitude"]

    flat.extend([
        mag.get("largestConstraint", 0),
        mag.get("logLargestConstraint", 0),
        mag.get("quadraticFeasibilityScore", 0),
        mag.get("cubicFeasibilityScore", 0),
        mag.get("linearRequiredScore", 0),
        mag.get("densityEstimate", 0) or 0
    ])

    # ------------------------------
    # Structure features
    # ------------------------------
    struct = feature_obj["structure"]

    flat.extend([
        int(struct.get("hasGraph", 0)),
        int(struct.get("hasTree", 0)),
        int(struct.get("hasPermutation", 0)),
        int(struct.get("hasMatrix", 0)),
        int(struct.get("hasString", 0)),
        int(struct.get("hasQueries", 0)),
        int(struct.get("multipleTestCases", 0))
    ])

    # ------------------------------
    # Keyword category counts
    # ------------------------------
    keyword_cats = feature_obj["keywords"]["categories"]

    for cat in KEYWORD_CATEGORIES:
        flat.append(keyword_cats.get(cat, 0))

    # ------------------------------
    # Keyword normalized densities
    # ------------------------------
    keyword_norm = feature_obj["keywords"]["normalized"]

    for cat in KEYWORD_CATEGORIES:
        flat.append(keyword_norm.get(f"{cat}_density", 0))

    # ------------------------------
    # Output type features
    # ------------------------------
    out = feature_obj["output"]

    flat.extend([
        out.get("isDecisionProblem", 0),
        out.get("isCountingProblem", 0),
        out.get("isOptimizationProblem", 0),
        out.get("isConstructiveProblem", 0),
        out.get("isPathOutput", 0)
    ])

    # ------------------------------
    # Interaction features
    # ------------------------------
    inter = feature_obj["interactions"]

    flat.extend([
        inter.get("rangeQueryPressureScore", 0),
        inter.get("largeGraphScore", 0),
        inter.get("sparseGraphScore", 0),
        inter.get("permutationLargeScore", 0),
        inter.get("stringAlgorithmPressure", 0),
        inter.get("heavyMathScore", 0)
    ])

    # ------------------------------
    # Text statistics
    # ------------------------------
    stats = feature_obj["stats"]

    flat.extend([
        stats.get("statementLength", 0),
        stats.get("wordCount", 0),
        stats.get("digitCount", 0),
        stats.get("inequalityCount", 0)
    ])

    return np.array(flat, dtype=np.float32)