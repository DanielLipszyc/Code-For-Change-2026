import "server-only";
import sharp from "sharp";
import { supabase } from "./db";

/**
 * Submission photos, kept in Supabase Storage rather than in the database.
 * The bucket is private (created by supabase/schema.sql): only server code
 * reads it, through GET /api/submissions/[id]/photo, which applies the
 * submission's visibility rules.
 *
 * Each submission has two files, both JPEG:
 *   <id>/photo.jpg  up to 1600 px, for the details view
 *   <id>/thumb.jpg  320 px wide, for lists
 */
export const PHOTO_BUCKET = "submission-photos";

export type PhotoSize = "full" | "thumb";

const FULL_MAX_SIZE = 1600;
const THUMB_WIDTH = 320;

// Only raster formats: an SVG served from this origin could run script
const PHOTO_DATA_URL = /^data:image\/(?:jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;

/** The photo couldn't be read as an image */
export class InvalidPhotoError extends Error {}

export const photoPath = (submissionId: string, size: PhotoSize) =>
  `${submissionId}/${size === "thumb" ? "thumb" : "photo"}.jpg`;

/** The bytes of an inline JPEG, PNG or WebP photo; null for anything else */
export function decodePhotoDataUrl(dataUrl: string): Buffer | null {
  const match = PHOTO_DATA_URL.exec(dataUrl);
  return match ? Buffer.from(match[1], "base64") : null;
}

/**
 * Re-encode a photo as the two stored JPEGs. Turned upright from its EXIF
 * orientation, and its metadata is dropped, so a camera's GPS tag never
 * reaches other users. Throws InvalidPhotoError if it isn't a readable image.
 */
export async function preparePhoto(bytes: Buffer): Promise<{ full: Buffer; thumb: Buffer }> {
  try {
    const image = sharp(bytes, { failOn: "error" }).rotate();
    const [full, thumb] = await Promise.all([
      image
        .clone()
        .resize({
          width: FULL_MAX_SIZE,
          height: FULL_MAX_SIZE,
          fit: "inside",
          withoutEnlargement: true,
        })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer(),
      image
        .clone()
        .resize({ width: THUMB_WIDTH, withoutEnlargement: true })
        .flatten({ background: "#ffffff" })
        .jpeg({ quality: 70, mozjpeg: true })
        .toBuffer(),
    ]);
    return { full, thumb };
  } catch (error) {
    throw new InvalidPhotoError(`Photo couldn't be read: ${(error as Error).message}`);
  }
}

function isAlreadyStored(error: { message: string; statusCode?: string }) {
  return error.statusCode === "409" || /already exists/i.test(error.message);
}

async function upload(path: string, bytes: Buffer) {
  const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, bytes, {
    contentType: "image/jpeg",
    // A submission's photo never changes, so browsers may keep it
    cacheControl: "31536000",
    // Never replace a stored photo. One already there is from an earlier
    // attempt at sending the same report, so it's the same photo.
    upsert: false,
  });
  if (error && !isAlreadyStored(error as { message: string; statusCode?: string })) throw error;
}

/**
 * Store a submission's photo (a data URL from the submit form) and its
 * thumbnail. Returns the photo's storage path, for submissions.photo_path.
 */
export async function storePhoto(submissionId: string, dataUrl: string): Promise<string> {
  const bytes = decodePhotoDataUrl(dataUrl);
  if (!bytes) throw new InvalidPhotoError("Photo must be a JPEG, PNG or WebP image");

  const { full, thumb } = await preparePhoto(bytes);
  await upload(photoPath(submissionId, "full"), full);
  await upload(photoPath(submissionId, "thumb"), thumb);
  return photoPath(submissionId, "full");
}

/** A stored photo's bytes, or null if the file isn't there */
export async function readStoredPhoto(
  submissionId: string,
  size: PhotoSize,
): Promise<Buffer | null> {
  const { data, error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .download(photoPath(submissionId, size));
  if (error) {
    if ((error as { status?: number }).status === 404 || /not found/i.test(error.message)) {
      return null;
    }
    throw error;
  }
  return Buffer.from(await data.arrayBuffer());
}

/** Delete a submission's stored photos. Missing files are fine. */
export async function deleteStoredPhotos(submissionId: string): Promise<void> {
  const { error } = await supabase.storage
    .from(PHOTO_BUCKET)
    .remove([photoPath(submissionId, "full"), photoPath(submissionId, "thumb")]);
  if (error) throw error;
}
