import type { SpeciesScore } from "./bioclip";

// Provisional cutoffs for BioCLIP's catalog-relative softmax scores; tune with labeled photos.
export const MIN_IDENTIFICATION_CONFIDENCE = 0.25;
export const MIN_AMBIGUOUS_CONFIDENCE = 0.15;
export const MAX_AMBIGUOUS_SCORE_GAP = 0.05;
export const MIN_RAW_SIMILARITY = 0.65;

export type ScoreDecision =
  | { status: "identified"; candidates: [SpeciesScore] }
  | { status: "ambiguous"; candidates: [SpeciesScore, SpeciesScore] }
  | { status: "uncertain"; candidates: [] };

export function decideFromScores(scores: SpeciesScore[]): ScoreDecision {
  const [best, runnerUp] = scores;
  if (!best || best.confidence < MIN_IDENTIFICATION_CONFIDENCE) {
    return { status: "uncertain", candidates: [] };
  }

  // Domain gate: reject low raw cosine alignment before softmax inflation causes false positives
  if (typeof best.rawSimilarity === "number" && best.rawSimilarity < MIN_RAW_SIMILARITY) {
    return { status: "uncertain", candidates: [] };
  }

  if (
    runnerUp &&
    runnerUp.confidence >= MIN_AMBIGUOUS_CONFIDENCE &&
    best.confidence - runnerUp.confidence <= MAX_AMBIGUOUS_SCORE_GAP
  ) {
    return { status: "ambiguous", candidates: [best, runnerUp] };
  }

  return { status: "identified", candidates: [best] };
}
