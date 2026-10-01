import { z } from "zod";
import { plants } from "@/data/plants";
import { MAX_IMAGE_DATA_LENGTH, MAX_NOTES_LENGTH, UNKNOWN_PLANT, isInAlachua } from "./limits";

/**
 * What each API endpoint accepts. Every string stored from here is later shown
 * to other users (map, log, dashboard), so only known species names, bounded
 * notes and inline images are accepted.
 */

/** Clerk user IDs. Also what's allowed inside a PostgREST filter string. */
export const CLERK_USER_ID = /^[A-Za-z0-9_]+$/;

const UNKNOWN_ALIASES = new Set(["unknown", "unknown plant"]);

/**
 * Misspellings used by earlier versions of the plant list, mapped to the
 * current name, so editing an older submission still works.
 */
const LEGACY_NAMES: Record<string, string> = {
  "coral adicea": "coral ardisia",
  "caeser's weed": "caesar's weed",
};

/**
 * Resolve a client-supplied plant name to a species from the plant list.
 * The scientific name always comes from the list, never from the client.
 * Returns null if the name isn't a known species or "Unknown".
 */
export function resolvePlant(
  name: unknown,
): { plantName: string; scientificName: string | null } | null {
  if (typeof name !== "string") return null;

  const trimmed = name.trim().toLowerCase();
  if (UNKNOWN_ALIASES.has(trimmed)) {
    return { plantName: UNKNOWN_PLANT, scientificName: null };
  }

  const key = LEGACY_NAMES[trimmed] ?? trimmed;
  const plant = plants.find((p) => p.name.toLowerCase() === key);
  return plant ? { plantName: plant.name, scientificName: plant.scientificName } : null;
}

const plantSchema = z
  .string({
    error: (issue) =>
      issue.input === undefined ? "Plant name is required" : "Plant name must be text",
  })
  .transform((name, ctx) => {
    const plant = resolvePlant(name);
    if (!plant) {
      ctx.addIssue({
        code: "custom",
        message: "Plant name must be one of the listed species or Unknown",
      });
      return z.NEVER;
    }
    return plant;
  });

const notesTextSchema = z
  .string({ error: "Notes must be text" })
  .trim()
  .max(MAX_NOTES_LENGTH, { error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer` });

/** Blank notes are stored as null */
const notesSchema = notesTextSchema.nullable().transform((notes) => notes || null);

const IMAGE_DATA_URL = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+={0,2}$/;
const IMAGE_TYPE_ERROR = "Photo must be a JPEG, PNG or WebP image";

/**
 * An inline JPEG, PNG or WebP image. Only inline data is accepted, so a
 * submission can't point viewers' browsers at an outside URL.
 */
const imageDataSchema = z
  .string({ error: IMAGE_TYPE_ERROR })
  // Size first; abort so the pattern never runs on an oversized value
  .max(MAX_IMAGE_DATA_LENGTH, { error: "Photo is too large", abort: true })
  .regex(IMAGE_DATA_URL, { error: IMAGE_TYPE_ERROR });

const coordinateSchema = z.number({ error: "lat and lng must be numbers" });

/** POST /api/submissions */
export const createSubmissionSchema = z
  .object({
    plantName: plantSchema,
    lat: coordinateSchema,
    lng: coordinateSchema,
    locationAccuracyM: z
      .number({ error: "locationAccuracyM must be a number" })
      .nonnegative()
      .max(100_000)
      .nullish()
      .transform((meters) => meters ?? null),
    notes: notesSchema.optional().transform((notes) => notes ?? null),
    // An empty string means no photo
    imageData: z
      .preprocess((image) => (image === "" ? null : image), imageDataSchema.nullish())
      .transform((image) => image ?? null),
    anonymous: z.boolean().optional().default(false),
  })
  .refine(({ lat, lng }) => isInAlachua(lat, lng), {
    error: "Location must be within Alachua County",
  });

/** PUT /api/submissions/[id]. Only the plant and notes can change. */
export const updateSubmissionSchema = z
  .object({
    plantName: plantSchema.optional(),
    // Missing means "leave as is"; null or blank clears the notes
    notes: notesSchema.optional(),
  })
  .refine(({ plantName, notes }) => plantName !== undefined || notes !== undefined, {
    error: "Nothing to update: send plantName and/or notes",
  });

/** POST /api/dashboard (follow or unfollow an observer) */
export const followSchema = z.object({
  targetUserId: z
    .string({ error: "A valid observer ID is required" })
    .max(64)
    .regex(CLERK_USER_ID, { error: "A valid observer ID is required" }),
});

/** POST /api/identify-plant */
export const identifyPlantSchema = z.object({
  image: z
    .unknown()
    .refine((image) => image !== undefined && image !== null && image !== "", {
      error: "No image provided",
    })
    .pipe(imageDataSchema),
});

export type CreateSubmissionInput = z.output<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.output<typeof updateSubmissionSchema>;
