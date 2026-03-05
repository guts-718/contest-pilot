import pandas as pd
import json
import ast

INPUT_CSV = "../dataset/codeforces_problems.csv"
OUTPUT_JSON = "../dataset/raw_problems.json"


df = pd.read_csv(INPUT_CSV)

dataset = []

for idx, row in df.iterrows():

    statement = str(row.get("problem_statement", ""))
    inp = str(row.get("input", ""))
    out = str(row.get("output", ""))

    time_limit = str(row.get("time_limit", ""))
    memory_limit = str(row.get("memory_limit", ""))

    # combine into one text block
    raw_text = "\n".join([
        statement,
        "Input:",
        inp,
        "Output:",
        out,
        f"Time Limit: {time_limit}",
        f"Memory Limit: {memory_limit}"
    ])

    # parse tags
    try:
        tags = ast.literal_eval(row["tags"])
        tags = [t.strip() for t in tags if not t.startswith("*")]
    except:
        tags = []

    dataset.append({
        "id": f"cf_{idx}",
        "platform": "codeforces",
        "raw_text": raw_text,
        "labels": tags
    })


with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
    json.dump(dataset, f, indent=2)

print("Converted dataset size:", len(dataset))