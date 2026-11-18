import "server-only";

/** How sure the model is that the photo shows one species, from 0 to 1 */
export interface SpeciesScore {
  name: string;
  scientificName?: string;
  confidence: number;
  rawSimilarity?: number;
}

export interface BioclipDebug {
  maxSpeciesRawSimilarity?: number;
  topDistractorPrompt?: string;
  topDistractorConfidence?: number;
}

export interface BioclipResult {
  scores: SpeciesScore[];
  debug?: BioclipDebug;
}

/** Modal cold-starts the GPU container on the first call after it idles */
const TIMEOUT_MS = 140_000;

function isSpeciesScore(value: unknown): value is SpeciesScore {
  if (typeof value !== "object" || value === null) return false;
  const score = value as Record<string, unknown>;
  return (
    typeof score.name === "string" &&
    score.name.length > 0 &&
    (typeof score.scientificName === "string" || score.scientificName === undefined) &&
    typeof score.confidence === "number" &&
    Number.isFinite(score.confidence) &&
    (typeof score.rawSimilarity === "number" || score.rawSimilarity === undefined)
  );
}

/**
 * Ask the BioCLIP model (services/plant-id, deployed on Modal) to score a
 * photo against every listed species. Returns the scores, highest first.
 * Throws if the model can't be reached or replies with something else.
 *
 * This is the only BioCLIP-specific code: switching models means adding a
 * file like this one and calling it from ./index.ts.
 */
export async function scoreWithBioclip(
  endpoint: { url: string; proxyKey?: string; proxySecret?: string },
  imageDataUrl: string,
): Promise<BioclipResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (endpoint.proxyKey && endpoint.proxySecret) {
    headers["Modal-Key"] = endpoint.proxyKey;
    headers["Modal-Secret"] = endpoint.proxySecret;
  }

  const response = await fetch(endpoint.url, {
    method: "POST",
    headers,
    body: JSON.stringify({ image: imageDataUrl }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error(`Plant ID model error ${response.status}: ${await response.text()}`);
  }

  const data: unknown = await response.json();
  const parsed = data as { scores?: unknown; debug?: BioclipDebug } | null;
  if (!Array.isArray(parsed?.scores)) {
    throw new Error("Plant ID model replied without scores");
  }

  const scores = parsed.scores.filter(isSpeciesScore).sort((a, b) => b.confidence - a.confidence);

  return {
    scores,
    debug: parsed.debug,
  };
}
