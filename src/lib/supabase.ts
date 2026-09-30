import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!url) {
  throw new Error("Please define SUPABASE_URL in .env.local");
}

if (!secretKey) {
  throw new Error("Please define SUPABASE_SECRET_KEY in .env.local");
}

// Server-only client. Auth is handled by Clerk, so all DB access goes through
// API routes / server components using the secret key (bypasses RLS).
// Never import this from a client component.
export const supabase = createClient(url, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Replacement for ObjectId.isValid — Supabase primary keys are UUIDs. */
export function isValidId(id: string): boolean {
  return UUID_RE.test(id);
}

// ---------------------------------------------------------------------------
// Row types (snake_case, as stored in Postgres)
// ---------------------------------------------------------------------------

export interface SubmissionRow {
  id: string;
  plant_name: string;
  scientific_name: string | null;
  lat: number;
  lng: number;
  timestamp_ms: number;
  notes: string | null;
  image_data: string | null;
  user_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string | null;
  status: "pending" | "approved";
  approved_at: string | null;
  approved_by: string | null;
}

export interface SightingRow {
  id: string;
  species_id: string | null;
  lat: number;
  lng: number;
  location_accuracy_m: number | null;
  address_approx: string | null;
  observed_at: string;
  reported_at: string;
  notes: string;
  status: string;
  user_id: string | null;
  created_by: string | null;
  updated_at: string | null;
}

// ---------------------------------------------------------------------------
// Row -> API shape (camelCase with `_id`, matching what the frontend expects)
// ---------------------------------------------------------------------------

export function toSubmission(row: SubmissionRow) {
  return {
    _id: row.id,
    plantName: row.plant_name,
    scientificName: row.scientific_name,
    lat: row.lat,
    lng: row.lng,
    timestamp: Number(row.timestamp_ms),
    notes: row.notes,
    imageData: row.image_data,
    userId: row.user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
    approvedAt: row.approved_at,
    approvedBy: row.approved_by,
  };
}

export function toSighting(row: SightingRow) {
  return {
    _id: row.id,
    speciesId: row.species_id,
    lat: row.lat,
    lng: row.lng,
    locationAccuracyM: row.location_accuracy_m,
    addressApprox: row.address_approx,
    observedAt: row.observed_at,
    reportedAt: row.reported_at,
    notes: row.notes,
    status: row.status,
    userId: row.user_id,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  };
}
