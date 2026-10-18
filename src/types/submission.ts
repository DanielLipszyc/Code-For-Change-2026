export type SubmissionStatus = "pending" | "approved";

/**
 * A plant sighting as the API and pages receive it (built by
 * server/submissions.ts). Dates are ISO 8601 strings.
 */
export interface Submission {
  id: string;
  plantName: string;
  scientificName: string | null;
  lat: number;
  lng: number;
  /** GPS accuracy radius in meters, as reported by the device */
  locationAccuracyM: number | null;
  /** When the plant was spotted, in epoch milliseconds */
  timestamp: number;
  notes: string | null;
  hasPhoto: boolean;
  /** Where to load the photo (add ?size=thumb for a small one). Answers 404 when there's none. */
  photoUrl: string;
  /** Submitter's Clerk ID. Only sent to the submitter and to admins. */
  userId: string | null;
  /** Public display name at the time of submission */
  createdBy: string | null;
  createdAt: string;
  updatedAt: string | null;
  status: SubmissionStatus;
  approvedAt: string | null;
}

/**
 * The little the map needs to draw a sighting. The rest (notes, submitter,
 * photo) loads when someone opens it, so the map's data stays small: about
 * 150 bytes per sighting instead of a whole submission.
 */
export type MapPoint = Pick<
  Submission,
  "id" | "plantName" | "scientificName" | "lat" | "lng" | "timestamp" | "status" | "hasPhoto"
>;
