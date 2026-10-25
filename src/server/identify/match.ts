import "server-only";
import { plants, type Plant } from "@/data/plants";

const normalize = (text: string) => text.toLowerCase().replace(/\s+/g, " ").trim();

/**
 * Map a species the model named to the plant list: by scientific name first
 * (the model and the list can spell common names differently), then by common
 * name. Returns null when neither matches.
 *
 * Callers return the matched plant, never the model's own text.
 */
export function matchPlant(candidate: { name?: string; scientificName?: string }): Plant | null {
  const scientificName = normalize(candidate.scientificName ?? "");
  const name = normalize(candidate.name ?? "");

  return (
    (scientificName && plants.find((p) => normalize(p.scientificName) === scientificName)) ||
    (name && plants.find((p) => normalize(p.name) === name)) ||
    null
  );
}
