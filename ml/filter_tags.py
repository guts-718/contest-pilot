import json
from collections import Counter

INPUT_PATH = "../dataset/processed_dataset.json"
OUTPUT_PATH = "../dataset/processed_filtered.json"

MIN_TAG_FREQ = 50
DROP_TAGS = {"implementation"} # it might be noisy since around 2600 problems have this and also it doesn't necessarily signify much

with open(INPUT_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

counter = Counter()

for item in data:
    for tag in item["labels"]:
        counter[tag] += 1

valid_tags = {tag for tag,count in counter.items() if count >= MIN_TAG_FREQ}
valid_tags = {
    tag for tag,count in counter.items()
    if count >= MIN_TAG_FREQ and tag not in DROP_TAGS
}

filtered = []

for item in data:
    labels = [t for t in item["labels"] if t in valid_tags]

    if labels:
        item["labels"] = labels
        filtered.append(item)

print("Original dataset:", len(data))
print("Filtered dataset:", len(filtered))
print("Remaining tags:", len(valid_tags))

with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
    json.dump(filtered, f, indent=2)

print("Filtered dataset saved.")

total_labels = sum(len(item["labels"]) for item in data)
avg_labels = total_labels / len(data)

print("\nAverage labels per problem:", round(avg_labels,2))

# Original dataset: 9238
# Filtered dataset: 9040
# Remaining tags: 31
# Filtered dataset saved.