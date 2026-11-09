import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPlants } = vi.hoisted(() => ({ getPlants: vi.fn() }));
vi.mock("@/server/plants", () => ({ getPlants }));

import { matchPlant } from "./match";

const catalog = [
  {
    id: "plant-1",
    slug: "coral-ardisia",
    name: "Coral Ardisia",
    scientificName: "Ardisia crenata",
    threatLevel: "Significant" as const,
    picUrl: null,
    tip: "red berries",
    es: { name: "Ardisia coral", tip: "bayas rojas" },
    pt: { name: "Ardísia-coral", tip: "bagas vermelhas" },
  },
  {
    id: "plant-2",
    slug: "caesars-weed",
    name: "Caesar's Weed",
    scientificName: "Urena lobata",
    threatLevel: "Significant" as const,
    picUrl: null,
    tip: "pink flowers",
    es: { name: "Hierba de César", tip: "flores rosas" },
    pt: { name: "Urena", tip: "flores rosas" },
  },
  {
    id: "plant-3",
    slug: "air-potato",
    name: "Air Potato",
    scientificName: "Dioscorea bulbifera",
    threatLevel: "Significant" as const,
    picUrl: null,
    tip: "heart-shaped leaves",
    es: { name: "Papa del Aire", tip: "hojas de corazón" },
    pt: { name: "Cará-do-ar", tip: "folhas em coração" },
  },
];

describe("matchPlant", () => {
  beforeEach(() => {
    getPlants.mockResolvedValue(catalog);
  });

  it("matches by scientific name, ignoring case and spacing", async () => {
    expect((await matchPlant({ scientificName: "  ardisia   CRENATA " }))?.name).toBe(
      "Coral Ardisia",
    );
  });

  it("prefers the scientific name when the common name is spelled differently", async () => {
    expect(
      (await matchPlant({ name: "Caeser's Weed", scientificName: "Urena Lobata" }))?.name,
    ).toBe("Caesar's Weed");
  });

  it("falls back to the common name", async () => {
    expect((await matchPlant({ name: "air potato" }))?.name).toBe("Air Potato");
  });

  it("returns null for empty or unlisted species", async () => {
    expect(await matchPlant({})).toBeNull();
    expect(await matchPlant({ name: "   ", scientificName: "" })).toBeNull();
    expect(
      await matchPlant({ name: "Dandelion", scientificName: "Taraxacum officinale" }),
    ).toBeNull();
  });
});
