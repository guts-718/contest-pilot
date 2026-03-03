export interface EmbeddingResult {
  vector: number[];
  dimension: number;
}

export async function extractEmbedding(
  text: string
): Promise<EmbeddingResult | null> {

  try {

    // Placeholder for now.
    // Later: integrate real embedding provider (OpenAI / local model)

    const fakeVector = new Array(384).fill(0);

    return {
      vector: fakeVector,
      dimension: fakeVector.length
    };

  } catch (err) {
    console.error("Embedding extraction failed:", err);
    return null;
  }
}