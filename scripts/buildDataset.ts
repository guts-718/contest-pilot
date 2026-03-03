import fs from "fs";
import path from "path";
import { extractFeatures } from "../src/features/featureExtractor";

const RAW_PATH = path.join(__dirname, "../dataset/raw_problems.json");
const OUTPUT_PATH = path.join(__dirname, "../dataset/processed_dataset.json");

interface RawProblem {
  id: string;
  platform?: string;
  raw_text: string;
  labels: string[];
}

async function main() {
  console.log("Loading raw dataset...");

  const rawData: RawProblem[] = JSON.parse(
    fs.readFileSync(RAW_PATH, "utf-8")
  );

  const processed = [];

  for (const problem of rawData) {
    console.log(`Processing: ${problem.id}`);

    const features = await extractFeatures(problem.raw_text);

    processed.push({
      id: problem.id,
      platform: problem.platform ?? null,
      raw_text: problem.raw_text,
      features,
      labels: problem.labels
    });
  }

  fs.writeFileSync(
    OUTPUT_PATH,
    JSON.stringify(processed, null, 2),
    "utf-8"
  );

  console.log("Dataset built successfully.");
}

main().catch(err => {
  console.error("Dataset build failed:", err);
});