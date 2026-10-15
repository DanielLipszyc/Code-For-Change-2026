import { plants } from "@/data/plants";

/**
 * Server-side validation for user-supplied submission fields.
 * Every string stored here is later shown to other users (map, log, dashboard),
 * so only known species names and bounded notes are accepted.
 */

export const UNKNOWN_PLANT = "Unknown Plant";
export const MAX_NOTES_LENGTH = 1000;

const UNKNOWN_ALIASES = new Set(["unknown", "unknown plant"]);

/**
 * Resolve a client-supplied plant name to a species from the plant list.
 * The scientific name always comes from the list, never from the client.
 * Returns null if the name isn't a known species or "Unknown".
 */
export function resolvePlant(
  name: unknown
): { plantName: string; scientificName: string | null } | null {
  if (typeof name !== "string") return null;

  const key = name.trim().toLowerCase();
  if (UNKNOWN_ALIASES.has(key)) {
    return { plantName: UNKNOWN_PLANT, scientificName: null };
  }

  const plant = plants.find((p) => p.name.toLowerCase() === key);
  return plant ? { plantName: plant.name, scientificName: plant.scientificName } : null;
}

/**
 * Photos arrive as base64 data URLs from the submit form's canvas compressor
 * (JPEG, 800px). ~2M characters is about 1.5 MB of image, far above that.
 */
export const MAX_IMAGE_DATA_LENGTH = 2_000_000;
const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Validate an optional photo. Only inline JPEG/PNG/WebP data is accepted, so a
 * submission can't point viewers' browsers at an outside URL.
 */
export function parseImageData(
  imageData: unknown
): { value: string | null } | { error: string } {
  if (imageData === undefined || imageData === null || imageData === "") {
    return { value: null };
  }
  if (typeof imageData !== "string") {
    return { error: "Photo must be a JPEG, PNG or WebP image" };
  }
  // Size first, so the pattern check never runs on an oversized payload
  if (imageData.length > MAX_IMAGE_DATA_LENGTH) {
    return { error: "Photo is too large" };
  }
  if (!IMAGE_DATA_URL.test(imageData)) {
    return { error: "Photo must be a JPEG, PNG or WebP image" };
  }
  return { value: imageData };
}

/**
 * Validate optional notes. Returns the trimmed text (or null when empty),
 * or an error message when the value is the wrong type or too long.
 */
export function parseNotes(
  notes: unknown
): { value: string | null } | { error: string } {
  if (notes === undefined || notes === null) return { value: null };
  if (typeof notes !== "string") return { error: "Notes must be text" };

  const trimmed = notes.trim();
  if (trimmed.length > MAX_NOTES_LENGTH) {
    return { error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer` };
  }
  return { value: trimmed || null };
}
