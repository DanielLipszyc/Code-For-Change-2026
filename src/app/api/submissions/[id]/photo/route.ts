import { NextRequest } from "next/server";
import { getViewer } from "@/server/authz";
import { jsonError } from "@/server/http";
import { getPhoto, isValidId } from "@/server/submissions";

/**
 * GET /api/submissions/[id]/photo
 * The submission's photo as an image. Lists link here instead of embedding
 * photos, so the browser only downloads the ones it shows. Same visibility as
 * the submission: pending photos answer 404 to everyone but the submitter and
 * admins.
 */
export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    if (!isValidId(id)) return jsonError(400, "Invalid submission ID");

    const photo = await getPhoto(id, await getViewer());
    if (!photo) return jsonError(404, "Photo not found");

    return new Response(new Uint8Array(photo.bytes), {
      headers: {
        "Content-Type": photo.contentType,
        "Content-Length": String(photo.bytes.length),
        // Photos never change. "private" keeps shared caches from holding on to
        // one after it's deleted; pending photos aren't cached at all.
        "Cache-Control": photo.isPublic ? "private, max-age=3600" : "private, no-store",
      },
    });
  } catch (error) {
    console.error("Error fetching photo:", error);
    return jsonError(500, "Failed to fetch photo");
  }
}
