import { createLocalEmbedding } from "../src/matching";

export type EmbeddingResponse = {
  vectors: number[][];
  provider: string;
  fallbackReason?: string;
};

const DEFAULT_MODEL = "gemini-embedding-001";
const MAX_INPUT_CHARS = 24_000;

export async function embedTexts(texts: string[]): Promise<EmbeddingResponse> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = normalizeGeminiModel(process.env.GEMINI_EMBEDDING_MODEL || DEFAULT_MODEL);
  const safeTexts = texts.map((text) => text.slice(0, MAX_INPUT_CHARS));

  if (!apiKey) {
    return {
      vectors: safeTexts.map(createLocalEmbedding),
      provider: "local-hashed",
      fallbackReason: "GEMINI_API_KEY is not set.",
    };
  }

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${model}:batchEmbedContents?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requests: safeTexts.map((text) => ({
            model,
            taskType: "SEMANTIC_SIMILARITY",
            content: {
              parts: [{ text }],
            },
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Gemini embeddings request returned ${response.status}: ${await response.text()}`);
    }

    const data = (await response.json()) as GeminiBatchEmbeddingResponse;
    const vectors = data.embeddings.map((embedding) => embedding.values);
    return {
      vectors,
      provider: `gemini:${model.replace("models/", "")}`,
    };
  } catch (error) {
    return {
      vectors: safeTexts.map(createLocalEmbedding),
      provider: "local-hashed",
      fallbackReason: error instanceof Error ? error.message : "Gemini embeddings request failed.",
    };
  }
}

type GeminiBatchEmbeddingResponse = {
  embeddings: Array<{
    values: number[];
  }>;
};

function normalizeGeminiModel(model: string): string {
  return model.startsWith("models/") ? model : `models/${model}`;
}
