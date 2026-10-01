/**
 * Limits shared by the forms and the server-side schemas (lib/schemas.ts).
 * Kept separate so the forms can import them without bundling zod.
 */

/** Stored when the submitter couldn't identify the plant */
export const UNKNOWN_PLANT = "Unknown Plant";

export const MAX_NOTES_LENGTH = 1000;

/**
 * Photos arrive as base64 data URLs from the submit form's canvas compressor
 * (JPEG, 800px). ~2M characters is about 1.5 MB of image, far above that.
 */
export const MAX_IMAGE_DATA_LENGTH = 2_000_000;

/** Rough Alachua County bounds. Sightings outside them are rejected. */
export const ALACHUA_BOUNDS = { minLat: 29.3, maxLat: 29.9, minLng: -82.7, maxLng: -82.0 };

export function isInAlachua(lat: number, lng: number): boolean {
  const b = ALACHUA_BOUNDS;
  return lat >= b.minLat && lat <= b.maxLat && lng >= b.minLng && lng <= b.maxLng;
}
