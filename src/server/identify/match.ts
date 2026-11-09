import "server-only";
import { getPlants } from "@/server/plants";
import type { Plant } from "@/types/plant";

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Match model output against the active database catalog. Always return the
 * canonical catalog record, never the model's untrusted text.
 */
export async function matchPlant(candidate: {
  name?: string;
  scientificName?: string;
}): Promise<Plant | null> {
  const scientificName = normalize(candidate.scientificName ?? "");
  const name = normalize(candidate.name ?? "");
  const plants = await getPlants();

  return (
    (scientificName && plants.find((p) => normalize(p.scientificName) === scientificName)) ||
    (name && plants.find((p) => normalize(p.name) === name)) ||
    null
  );
}
