import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { updateSubmissionSchema } from "@/lib/schemas";
import { getViewer, isAdmin } from "@/server/authz";
import { MAX_BODY_BYTES, jsonError, parseJsonBody } from "@/server/http";
import {
  deleteSubmission,
  getSubmission,
  isValidId,
  updateOwnSubmission,
} from "@/server/submissions";

type Context = { params: Promise<{ id: string }> };

/**
 * GET /api/submissions/[id]
 * Approved submissions are public. Pending ones answer 404 to everyone but
 * their submitter and admins, so their existence isn't revealed.
 */
export async function GET(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;
    if (!isValidId(id)) return jsonError(400, "Invalid submission ID");

    const submission = await getSubmission(id, await getViewer());
    if (!submission) return jsonError(404, "Submission not found");

    return NextResponse.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    return jsonError(500, "Failed to fetch submission");
  }
}

/**
 * PUT /api/submissions/[id]
 * The submitter can change the plant and notes. Anyone else gets 404.
 */
export async function PUT(request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const { userId } = await auth();
    if (!userId) return jsonError(401, "Unauthorized - Please sign in");
    if (!isValidId(id)) return jsonError(400, "Invalid submission ID");

    const parsed = await parseJsonBody(request, updateSubmissionSchema, MAX_BODY_BYTES.small);
    if (!parsed.ok) return parsed.response;

    // Admins' edits to their own reports skip review; everyone else's go back to pending
    const updated = await updateOwnSubmission(id, userId, parsed.data, {
      keepApproval: await isAdmin(userId),
    });
    if (!updated) return jsonError(404, "Submission not found");

    return NextResponse.json({ success: true, message: "Submission updated successfully" });
  } catch (error) {
    console.error("Error updating submission:", error);
    return jsonError(500, "Failed to update submission");
  }
}

/**
 * DELETE /api/submissions/[id]
 * The submitter can delete their own submission; admins can delete any.
 */
export async function DELETE(_request: NextRequest, context: Context) {
  try {
    const { id } = await context.params;

    const { userId } = await auth();
    if (!userId) return jsonError(401, "Unauthorized - Please sign in");
    if (!isValidId(id)) return jsonError(400, "Invalid submission ID");

    // Checked live with Clerk rather than from the session token, so a removed
    // admin can't keep deleting other people's reports until the token refreshes
    const deleted = await deleteSubmission(id, { userId, isAdmin: await isAdmin(userId) });
    if (!deleted) return jsonError(404, "Submission not found");

    return NextResponse.json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return jsonError(500, "Failed to delete submission");
  }
}
