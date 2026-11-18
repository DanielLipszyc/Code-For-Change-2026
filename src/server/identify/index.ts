import "server-only";
import type { Plant } from "@/types/plant";
import { env } from "@/server/env";
import { scoreWithBioclip } from "./bioclip";
import {
  decideFromScores,
  MAX_AMBIGUOUS_SCORE_GAP,
  MIN_AMBIGUOUS_CONFIDENCE,
  MIN_IDENTIFICATION_CONFIDENCE,
  MIN_RAW_SIMILARITY,
} from "./decision";
import { matchPlant } from "./match";

const debugPlantId = process.env.PLANT_ID_DEBUG === "true";

export type PlantIdentification =
  | { status: "identified"; candidates: [Plant] }
  | { status: "ambiguous"; candidates: [Plant, Plant] }
  | { status: "uncertain"; candidates: [] };

/**
 * Identify the plant in a photo, given as a base64 data URL. Scores that are
 * weak or too close are returned as uncertain/ambiguous rather than selected.
 * Throws if the model isn't configured or can't be reached.
 */
export async function identifyPlant(imageDataUrl: string): Promise<PlantIdentification> {
  const { url, proxyKey, proxySecret } = env.plantId;
  if (!url) {
    throw new Error("MODAL_BIO_CLIP_URL is not set");
  }

  const { scores, debug } = await scoreWithBioclip({ url, proxyKey, proxySecret }, imageDataUrl);
  const decision = decideFromScores(scores);
  if (debugPlantId) {
    console.info("[plant-id] BioCLIP scores and decision", {
      topScores: scores.slice(0, 5).map(({ name, scientificName, confidence, rawSimilarity }) => ({
        name,
        scientificName,
        confidence,
        rawSimilarity,
      })),
      modalDebug: debug,
      decision: decision.status,
      thresholds: {
        minIdentificationConfidence: MIN_IDENTIFICATION_CONFIDENCE,
        minAmbiguousConfidence: MIN_AMBIGUOUS_CONFIDENCE,
        maxAmbiguousScoreGap: MAX_AMBIGUOUS_SCORE_GAP,
        minRawSimilarity: MIN_RAW_SIMILARITY,
      },
    });
  }

  if (decision.status === "uncertain") return decision;

  const plants = await Promise.all(decision.candidates.map((candidate) => matchPlant(candidate)));
  if (plants.some((plant) => !plant)) return { status: "uncertain", candidates: [] };

  if (decision.status === "ambiguous") {
    const [first, second] = plants;
    if (!first || !second) return { status: "uncertain", candidates: [] };
    return { status: "ambiguous", candidates: [first, second] };
  }

  const [plant] = plants;
  return plant
    ? { status: "identified", candidates: [plant] }
    : { status: "uncertain", candidates: [] };
}
