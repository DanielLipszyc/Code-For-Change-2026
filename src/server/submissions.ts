import "server-only";
import { randomUUID } from "node:crypto";
import { revalidateTag, unstable_cache } from "next/cache";
import { photoUrl } from "@/lib/photos";
import { CLERK_USER_ID } from "@/lib/schemas";
import type { CreateSubmissionInput, UpdateSubmissionInput } from "@/lib/schemas";
import type { MapPoint, Submission, SubmissionStatus } from "@/types/submission";
import type { Viewer } from "@/types/auth";
import { supabase } from "./db";
import { deleteStoredPhotos, readStoredPhoto, storePhoto, type PhotoSize } from "./photos";

/**
 * Every read and write of the submissions table. Visibility and ownership
 * rules live here, inside the queries, so a route can't forget them:
 * - approved submissions are public
 * - pending ones are visible only to their submitter and to admins
 * - only the submitter can edit; the submitter or an admin can delete
 */

/** A submissions row as stored in Postgres, minus the photo */
interface SubmissionRow {
  /** Generated column: photo_path or the older image_data is set */
  has_photo: boolean;
  id: string;
  plant_name: string;
  scientific_name: string | null;
  lat: number;
  lng: number;
  location_accuracy_m: number | null;
  timestamp_ms: number;
  notes: string | null;
  user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  status: SubmissionStatus;
  approved_at: string | null;
}

/** Everything except image_data: photos are large, so they're served on their own */
const COLUMNS =
  "id, plant_name, scientific_name, lat, lng, location_accuracy_m, timestamp_ms, notes, has_photo, user_id, created_by, created_at, updated_at, status, approved_at";

/**
 * Cache tag for data read from the submissions table. Every write below
 * clears it, so cached lists (and the pages built from them, like /map) are
 * rebuilt on their next request.
 */
const SUBMISSIONS_TAG = "submissions";

function submissionsChanged() {
  revalidateTag(SUBMISSIONS_TAG);
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Submission IDs are UUIDs */
export function isValidId(id: string): boolean {
  return UUID.test(id);
}

function isOwner(row: { user_id: string | null }, viewer: Viewer): boolean {
  return !!viewer.userId && row.user_id === viewer.userId;
}

function canSee(row: { status: SubmissionStatus; user_id: string | null }, viewer: Viewer) {
  return row.status === "approved" || viewer.isAdmin || isOwner(row, viewer);
}

function toSubmission(row: SubmissionRow, viewer: Viewer): Submission {
  return {
    id: row.id,
    plantName: row.plant_name,
    scientificName: row.scientific_name,
    lat: row.lat,
    lng: row.lng,
    locationAccuracyM: row.location_accuracy_m,
    timestamp: Number(row.timestamp_ms),
    notes: row.notes,
    hasPhoto: row.has_photo,
    photoUrl: photoUrl(row.id),
    // Other people's Clerk IDs are never sent
    userId: viewer.isAdmin || isOwner(row, viewer) ? row.user_id : null,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    approvedAt: row.approved_at,
  };
}

/**
 * Submissions the viewer can see, most recently spotted first. With `mine`,
 * only the viewer's own submissions (any status); with `status`, only
 * submissions in that state.
 */
export async function listSubmissions(
  viewer: Viewer,
  { mine = false, status }: { mine?: boolean; status?: SubmissionStatus } = {},
): Promise<Submission[]> {
  if (mine && !viewer.userId) return [];

  let query = supabase
    .from("submissions")
    .select(COLUMNS)
    .order("timestamp_ms", { ascending: false });

  if (status) {
    query = query.eq("status", status);
  }

  if (mine && viewer.userId) {
    query = query.eq("user_id", viewer.userId);
  } else if (!viewer.isAdmin) {
    // Clerk IDs are [A-Za-z0-9_]; anything else must not reach the filter string
    query =
      viewer.userId && CLERK_USER_ID.test(viewer.userId)
        ? query.or(`status.eq.approved,user_id.eq.${viewer.userId}`)
        : query.eq("status", "approved");
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as SubmissionRow[]).map((row) => toSubmission(row, viewer));
}

interface MapPointRow {
  id: string;
  has_photo: boolean;
  plant_name: string;
  scientific_name: string | null;
  lat: number;
  lng: number;
  timestamp_ms: number;
  status: SubmissionStatus;
}

/**
 * Every approved sighting, with only what the map draws. The same for every
 * visitor, so it's cached until a submission changes and /map can be built
 * once and served to everyone.
 */
export const listPublicMapPoints = unstable_cache(
  async (): Promise<MapPoint[]> => {
    // CI builds the app without a database (see .github/workflows/ci.yml)
    if (process.env.BUILD_WITHOUT_DATABASE === "1") return [];

    const { data, error } = await supabase
      .from("submissions")
      .select("id, plant_name, scientific_name, lat, lng, timestamp_ms, status, has_photo")
      .eq("status", "approved")
      .order("timestamp_ms", { ascending: false });
    if (error) throw error;

    return (data as MapPointRow[]).map((row) => ({
      id: row.id,
      plantName: row.plant_name,
      scientificName: row.scientific_name,
      lat: row.lat,
      lng: row.lng,
      timestamp: Number(row.timestamp_ms),
      status: row.status,
      hasPhoto: row.has_photo,
    }));
  },
  ["public-map-points"],
  { tags: [SUBMISSIONS_TAG] },
);

/** One submission, or null if it doesn't exist or the viewer can't see it */
export async function getSubmission(id: string, viewer: Viewer): Promise<Submission | null> {
  if (!isValidId(id)) return null;

  const { data, error } = await supabase
    .from("submissions")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;

  const row = data as SubmissionRow | null;
  return row && canSee(row, viewer) ? toSubmission(row, viewer) : null;
}

// Photos stored before they moved to Supabase Storage: a data URL in
// image_data. Only raster formats: an SVG served from this origin could run script.
const LEGACY_PHOTO = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

/**
 * A submission's photo (or its thumbnail). Null if there is no photo or the
 * viewer can't see the submission.
 */
export async function getPhoto(
  id: string,
  viewer: Viewer,
  size: PhotoSize = "full",
): Promise<{ contentType: string; bytes: Buffer; isPublic: boolean } | null> {
  if (!isValidId(id)) return null;

  const { data, error } = await supabase
    .from("submissions")
    .select("status, user_id, photo_path, image_data")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data || !canSee(data, viewer)) return null;
  const isPublic = data.status === "approved";

  if (data.photo_path) {
    const bytes = await readStoredPhoto(id, size);
    return bytes && { contentType: "image/jpeg", bytes, isPublic };
  }

  // Not moved to Storage yet (scripts/move-photos-to-storage.ts): no
  // thumbnail, so both sizes get the photo itself
  const match = data.image_data ? LEGACY_PHOTO.exec(data.image_data) : null;
  if (!match) return null;
  return { contentType: match[1], bytes: Buffer.from(match[2], "base64"), isPublic };
}

/** A submission with this ID is already stored (usually: the same report, sent again) */
export class DuplicateSubmissionError extends Error {
  constructor(readonly id: string) {
    super(`Submission ${id} already exists`);
  }
}

/** Postgres's unique_violation */
const UNIQUE_VIOLATION = "23505";

/**
 * Save a new submission and return its ID. The client may choose the ID
 * (input.id) so a resent report isn't stored twice: storing an ID that
 * already exists throws DuplicateSubmissionError and changes nothing.
 */
export async function createSubmission(
  input: CreateSubmissionInput,
  submitter: { userId: string | null; displayName: string; autoApprove: boolean },
): Promise<string> {
  const id = input.id ?? randomUUID();
  // Stored first, under the submission's ID, so the row never points at a
  // photo that isn't there. Sent again, the photo is already there and isn't
  // replaced.
  const photoPath = input.imageData ? await storePhoto(id, input.imageData) : null;
  const { error } = await supabase.from("submissions").insert({
    id,
    plant_name: input.plantName.plantName,
    scientific_name: input.plantName.scientificName,
    lat: input.lat,
    lng: input.lng,
    location_accuracy_m: input.locationAccuracyM,
    // Reports saved offline carry the time they were made (checked by the
    // schema); everything else was spotted just now
    timestamp_ms: input.observedAt ?? Date.now(),
    notes: input.notes,
    photo_path: photoPath,
    user_id: submitter.userId,
    created_by: submitter.displayName,
    status: submitter.autoApprove ? "approved" : "pending",
  });
  // A duplicate keeps its photos: they belong to the submission already stored
  if (error?.code === UNIQUE_VIOLATION) throw new DuplicateSubmissionError(id);
  if (error) {
    if (photoPath) await deleteStoredPhotos(id).catch(logPhotoCleanupError);
    throw error;
  }
  submissionsChanged();
  return id;
}

/**
 * Edit the submitter's own submission. Returns false if it doesn't exist or
 * belongs to someone else; the ownership check is part of the update itself.
 * Unless keepApproval is set, the report goes back to pending, so an approved
 * report can't be changed and stay on the public map unreviewed.
 */
export async function updateOwnSubmission(
  id: string,
  userId: string,
  changes: UpdateSubmissionInput,
  { keepApproval }: { keepApproval: boolean },
): Promise<boolean> {
  if (!isValidId(id)) return false;

  const fields: Record<string, string | null> = { updated_at: new Date().toISOString() };
  if (changes.plantName) {
    fields.plant_name = changes.plantName.plantName;
    fields.scientific_name = changes.plantName.scientificName;
  }
  if (changes.notes !== undefined) {
    fields.notes = changes.notes;
  }
  if (!keepApproval) {
    fields.status = "pending";
    fields.approved_at = null;
    fields.approved_by = null;
  }

  const { data, error } = await supabase
    .from("submissions")
    .update(fields)
    .eq("id", id)
    .eq("user_id", userId)
    .select("id");
  if (error) throw error;
  if (data.length > 0) submissionsChanged();
  return data.length > 0;
}

/**
 * Delete a submission: the submitter can delete their own, an admin can
 * delete any. Returns false if nothing was deleted.
 */
export async function deleteSubmission(id: string, viewer: Viewer): Promise<boolean> {
  if (!viewer.userId || !isValidId(id)) return false;

  let query = supabase.from("submissions").delete().eq("id", id);
  if (!viewer.isAdmin) {
    query = query.eq("user_id", viewer.userId);
  }

  const { data, error } = await query.select("id");
  if (error) throw error;
  if (data.length === 0) return false;

  submissionsChanged();
  await deleteStoredPhotos(id).catch(logPhotoCleanupError);
  return true;
}

/** Photos left behind cost a little storage but nothing else, so a failed cleanup isn't an error */
function logPhotoCleanupError(error: unknown) {
  console.error("Couldn't delete a submission's photos:", error);
}

/** Approve a submission (callers must check the user is an admin) */
export async function approveSubmission(id: string, adminId: string): Promise<boolean> {
  if (!isValidId(id)) return false;

  const { data, error } = await supabase
    .from("submissions")
    .update({ status: "approved", approved_at: new Date().toISOString(), approved_by: adminId })
    .eq("id", id)
    .select("id");
  if (error) throw error;
  if (data.length > 0) submissionsChanged();
  return data.length > 0;
}
