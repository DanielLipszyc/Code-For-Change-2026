import "server-only";
import { z } from "zod";
import type { PlantFeatures } from "@/types/plant-features";
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
  leaf: unknown;
  flower: unknown;
  reproductive_structure: unknown;
  form: unknown;
  is_active: boolean;
  sort_order: number;
  images: unknown;
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

const stringList = z.array(z.string());
const notes = z.string().optional();

const featureSchemas = {
  leaf: z.object({
    shape: stringList.optional(),
    margin: stringList.optional(),
    arrangement: stringList.optional(),
    venation: stringList.optional(),
    texture: stringList.optional(),
    notes,
  }),
  flower: z.object({
    color: stringList.optional(),
    shape: stringList.optional(),
    petal_count: z.number().optional(),
    inflorescence: stringList.optional(),
    season: stringList.optional(),
    notes,
  }),
  reproductive_structure: z.object({
    type: stringList.optional(),
    color: stringList.optional(),
    shape: stringList.optional(),
    surface: stringList.optional(),
    dispersal: stringList.optional(),
    notes,
  }),
  form: z.object({
    growth_habit: stringList.optional(),
    height_m: z.number().optional(),
    stem_type: stringList.optional(),
    habitat: stringList.optional(),
    notes,
  }),
} satisfies { [K in keyof PlantFeatures]: z.ZodType<PlantFeatures[K]> };

function parseFeature<K extends keyof PlantFeatures>(
  group: K,
  value: unknown,
  plantName: string,
): PlantFeatures[K] {
  // An unpopulated JSONB column is not a negative identification.
  const result = featureSchemas[group].safeParse(value ?? {});
  if (!result.success) {
    throw new Error(
      `Plant "${plantName}" has invalid ${group} feature data: ${result.error.message}`,
    );
  }
  return result.data;
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
    leaf: parseFeature("leaf", row.leaf, row.name),
    flower: parseFeature("flower", row.flower, row.name),
    reproductive_structure: parseFeature(
      "reproductive_structure",
      row.reproductive_structure,
      row.name,
    ),
    form: parseFeature("form", row.form, row.name),
    images: Array.isArray(row.images)
      ? row.images.map((img) => {
          if (typeof img !== "object" || img === null) {
            throw new Error(`Plant "${row.name}" has an invalid image entry.`);
          }
          const { url, caption } = img as Record<string, unknown>;
          if (typeof url !== "string") {
            throw new Error(`Plant "${row.name}" has an image with a missing or invalid URL.`);
          }
          if (caption !== undefined && typeof caption !== "string") {
            throw new Error(`Plant "${row.name}" has an image with an invalid caption.`);
          }
          return { url, caption };
        })
      : [],
  };
}

const readPlants = unstable_cache(
  async (): Promise<Plant[]> => {
    // CI builds the app without a database (see .github/workflows/ci.yml).
    if (process.env.BUILD_WITHOUT_DATABASE === "1") return [];

    const { data, error } = await supabase
      .from("plants")
      .select(
        "id, slug, name, scientific_name, threat_level, pic_url, tip, translations, is_active, sort_order, leaf, flower, reproductive_structure, form, images",
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
