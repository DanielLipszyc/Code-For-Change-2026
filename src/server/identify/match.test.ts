import { describe, expect, it } from "vitest";
import { matchPlant } from "./match";

describe("matchPlant", () => {
  it("matches by scientific name, ignoring case and spacing", () => {
    expect(matchPlant({ scientificName: "  ardisia   CRENATA " })?.name).toBe("Coral Ardisia");
  });

  it("prefers the scientific name when the common name is spelled differently", () => {
    expect(matchPlant({ name: "Caeser's Weed", scientificName: "Urena Lobata" })?.name).toBe(
      "Caesar's Weed",
    );
  });

  it("falls back to the common name", () => {
    expect(matchPlant({ name: "air potato" })?.name).toBe("Air Potato");
  });

  it("returns null for empty or unlisted species", () => {
    expect(matchPlant({})).toBeNull();
    expect(matchPlant({ name: "   ", scientificName: "" })).toBeNull();
    expect(matchPlant({ name: "Dandelion", scientificName: "Taraxacum officinale" })).toBeNull();
  });
});
