import json
from collections import Counter

DATA_PATH = "../dataset/processed_dataset.json"

with open(DATA_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

counter = Counter()

for item in data:
    for tag in item["labels"]:
        counter[tag] += 1

print("Total unique tags:", len(counter))
print()

print("Top tags:")
for tag, count in counter.most_common(30):
    print(f"{tag:25} {count}")

print("\nRare tags (<50):")

rare = [t for t,c in counter.items() if c < 50]

for tag in sorted(rare):
    print(tag)

print("\nNumber of rare tags:", len(rare))


# Total unique tags: 36

# Top tags:
# math                      2720
# greedy                    2689
# implementation            2616
# dp                        2009
# constructive algorithms   1640
# data structures           1638
# brute force               1574
# sortings                  1011
# graphs                    1005
# binary search             999
# dfs and similar           879
# trees                     771
# number theory             697
# strings                   692
# combinatorics             636
# bitmasks                  534
# two pointers              506
# geometry                  377
# dsu                       336
# divide and conquer        270
# shortest paths            259
# probabilities             224
# games                     207
# hashing                   195
# interactive               194
# flows                     141
# matrices                  115
# graph matchings           89
# fft                       89
# string suffix structures  87

# Rare tags (<50):
# 2-sat
# chinese remainder theorem
# expression parsing
# meet-in-the-middle
# schedules

# Number of rare tags: 5