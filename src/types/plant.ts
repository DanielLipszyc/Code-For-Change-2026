import type { PlantFeatures } from "./plant-features";
export type ThreatLevel = "Low" | "Moderate" | "Significant";

export interface Plant extends PlantFeatures {
  id: string;
  slug: string;
  name: string;
  scientificName: string;
  threatLevel: ThreatLevel;
  picUrl: string | null;
  tip: string;
  es: { name: string; tip: string };
  pt: { name: string; tip: string };
  images: PlantImage[];
}

export interface PlantSelection {
  plantName: string;
  scientificName: string | null;
}

export interface PlantImage {
  url: string;
  caption?: string;
}

export function localizePlant(
  plant: Plant,
  language: "en" | "es" | "pt",
): { name: string; tip: string } {
  if (language === "es") return plant.es;
  if (language === "pt") return plant.pt;
  return { name: plant.name, tip: plant.tip };
}
