import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import type { Plant, PlantSelection, ThreatLevel } from "@/types/plant";
import { UNKNOWN_PLANT } from "@/lib/limits";
import { supabase } from "./db";

interface PlantRow {
  id: string;
  slug: string;
  name: string;
  scientific_name: string;
  threat_level: ThreatLevel;
  pic_url: string | null;
  tip: string;
  translations: unknown;
  is_active: boolean;
  sort_order: number;
}

const PLANTS_TAG = "plants";
const UNKNOWN_ALIASES = new Set(["unknown", "unknown plant"]);
const LEGACY_NAMES: Record<string, string> = {
  "coral adicea": "coral ardisia",
  "caeser's weed": "caesar's weed",
};

function translatedText(
  translations: unknown,
  language: "es" | "pt",
): { name: string; tip: string } {
  if (!translations || typeof translations !== "object") {
    throw new Error("A plant record has invalid translations.");
  }

  const value = (translations as Record<string, unknown>)[language];
  if (!value || typeof value !== "object") {
    throw new Error(`A plant record is missing its ${language} translation.`);
  }

  const translated = value as Record<string, unknown>;
  if (typeof translated.name !== "string" || typeof translated.tip !== "string") {
    throw new Error(`A plant record has an invalid ${language} translation.`);
  }

  return { name: translated.name, tip: translated.tip };
}

function toPlant(row: PlantRow): Plant {
  if (!["Low", "Moderate", "Significant"].includes(row.threat_level)) {
    throw new Error(`Plant "${row.name}" has an invalid threat level.`);
  }

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    scientificName: row.scientific_name,
    threatLevel: row.threat_level,
    picUrl: row.pic_url,
    tip: row.tip,
    es: translatedText(row.translations, "es"),
    pt: translatedText(row.translations, "pt"),
  };
}

const readPlants = unstable_cache(
  async (): Promise<Plant[]> => {
    // CI builds the app without a database (see .github/workflows/ci.yml).
    if (process.env.BUILD_WITHOUT_DATABASE === "1") return [];

    const { data, error } = await supabase
      .from("plants")
      .select(
        "id, slug, name, scientific_name, threat_level, pic_url, tip, translations, is_active, sort_order",
      )
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) throw error;
    return (data as PlantRow[]).map(toPlant);
  },
  ["active-plant-catalog"],
  { tags: [PLANTS_TAG], revalidate: 300 },
);

/** Return the active catalog in its configured display order. */
export async function getPlants(): Promise<Plant[]> {
  return readPlants();
}

/** Resolve an untrusted common name to canonical database-backed submission data. */
export async function resolvePlant(name: unknown): Promise<PlantSelection | null> {
  if (typeof name !== "string") return null;

  const trimmed = name.trim().toLowerCase();
  if (UNKNOWN_ALIASES.has(trimmed)) {
    return { plantName: UNKNOWN_PLANT, scientificName: null };
  }

  const key = LEGACY_NAMES[trimmed] ?? trimmed;
  const plant = (await getPlants()).find((item) => item.name.toLowerCase() === key);

  return plant ? { plantName: plant.name, scientificName: plant.scientificName } : null;
}

/** Clear the cached catalog after an administrative plant change. */
export function invalidatePlantCache() {
  revalidateTag(PLANTS_TAG);
}
