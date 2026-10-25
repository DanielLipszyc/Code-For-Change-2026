import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { localizePlant, plants } from "./plants";

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
      expect(plant.pt.name.trim()).not.toBe("");
      expect(plant.pt.tip.trim()).not.toBe("");
    }
  });

  it("localizes plant names and identification tips without changing stored names", () => {
    const airPotato = plants.find((plant) => plant.name === "Air Potato");
    expect(airPotato).toBeDefined();
    if (!airPotato) return;

    expect(localizePlant(airPotato, "en").name).toBe("Air Potato");
    expect(localizePlant(airPotato, "es").name).toBe("Papa del Aire");
    expect(localizePlant(airPotato, "pt").name).toBe("Cará-do-ar");
    expect(airPotato.name).toBe("Air Potato");
  });
});

describe("plant ID model's species list", () => {
  it("matches the plant list (run npm run plant-id:species after changing it)", () => {
    const file = new URL("../../services/plant-id/species.json", import.meta.url);
    const species: { name: string; scientific: string }[] = JSON.parse(readFileSync(file, "utf8"));
    expect(species).toEqual(plants.map((p) => ({ name: p.name, scientific: p.scientificName })));
  });
});
