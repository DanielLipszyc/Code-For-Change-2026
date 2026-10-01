import { describe, expect, it } from "vitest";
import { plants } from "./plants";

describe("plant list", () => {
  it("has no duplicate common or scientific names", () => {
    const names = plants.map((p) => p.name.toLowerCase());
    const scientificNames = plants.map((p) => p.scientificName.toLowerCase());
    expect(new Set(names).size).toBe(plants.length);
    expect(new Set(scientificNames).size).toBe(plants.length);
  });

  it("writes scientific names as Genus species", () => {
    for (const plant of plants) {
      expect(plant.scientificName).toMatch(/^[A-Z][a-z]+ [a-z]+$/);
    }
  });

  it("has guide text in every language", () => {
    for (const plant of plants) {
      expect(plant.tip.trim()).not.toBe("");
      expect(plant.es.name.trim()).not.toBe("");
      expect(plant.es.tip.trim()).not.toBe("");
    }
  });
});
