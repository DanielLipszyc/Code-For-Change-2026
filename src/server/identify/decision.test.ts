import { describe, expect, it } from "vitest";
import { decideFromScores } from "./decision";
import type { SpeciesScore } from "./bioclip";

const score = (name: string, confidence: number): SpeciesScore => ({
  name,
  scientificName: `${name} species`,
  confidence,
});

describe("decideFromScores", () => {
  it("accepts a strong top result with a clear lead", () => {
    expect(decideFromScores([score("Air Potato", 0.72), score("Coral Ardisia", 0.08)])).toEqual({
      status: "identified",
      candidates: [score("Air Potato", 0.72)],
    });
  });

  it("returns two candidates when plausible scores are close", () => {
    expect(decideFromScores([score("Air Potato", 0.31), score("Coral Ardisia", 0.29)])).toEqual({
      status: "ambiguous",
      candidates: [score("Air Potato", 0.31), score("Coral Ardisia", 0.29)],
    });
  });

  it("returns uncertain when the best score is weak", () => {
    expect(decideFromScores([score("Air Potato", 0.2), score("Coral Ardisia", 0.19)])).toEqual({
      status: "uncertain",
      candidates: [],
    });
  });

  it("does not call close but weak runner-up scores ambiguous", () => {
    expect(decideFromScores([score("Air Potato", 0.31), score("Coral Ardisia", 0.14)])).toEqual({
      status: "identified",
      candidates: [score("Air Potato", 0.31)],
    });
  });

  it("returns uncertain for an empty score list", () => {
    expect(decideFromScores([])).toEqual({ status: "uncertain", candidates: [] });
  });
});
