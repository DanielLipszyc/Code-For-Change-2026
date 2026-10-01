import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isValidId, toSubmission } from "@/server/db";
import { canEditSubmission, canDeleteSubmission, isAdmin } from "@/server/authz";
import { updateSubmissionSchema } from "@/lib/schemas";
import { MAX_BODY_BYTES, parseJsonBody } from "@/server/http";

/**
 * GET /api/submissions/[id]
 * Fetch a single submission by ID. Approved submissions are public;
 * pending ones are visible only to their owner and admins.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    const { data: submission, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const { userId } = await auth();
    const isOwner = !!userId && submission.user_id === userId;
    const canSeeAll = isOwner || (!!userId && (await isAdmin(userId)));

    // Pending reports answer 404 to everyone else, so their existence isn't revealed
    if (submission.status !== "approved" && !canSeeAll) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    const result = toSubmission(submission);
    return NextResponse.json(canSeeAll ? result : { ...result, userId: null });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json({ error: "Failed to fetch submission" }, { status: 500 });
  }
}

/**
 * PUT /api/submissions/[id]
 * Update a submission (requires ownership)
 */
export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    // Check if user can edit this submission
    const canEdit = await canEditSubmission(userId, id);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own submissions" },
        { status: 403 },
      );
    }

    // Only the plant and notes can be edited; the photo, location and
    // scientific name are never taken from the client
    const parsed = await parseJsonBody(request, updateSubmissionSchema, MAX_BODY_BYTES.small);
    if (!parsed.ok) return parsed.response;
    const { plantName, notes } = parsed.data;

    const updateFields: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };
    if (plantName) {
      updateFields.plant_name = plantName.plantName;
      updateFields.scientific_name = plantName.scientificName;
    }
    if (notes !== undefined) {
      updateFields.notes = notes;
    }

    // An edited report must be reviewed again, otherwise an approved report
    // could be changed after approval and go straight to the public map
    if (!(await isAdmin(userId))) {
      updateFields.status = "pending";
      updateFields.approved_at = null;
      updateFields.approved_by = null;
    }

    const { data: updated, error } = await supabase
      .from("submissions")
      .update(updateFields)
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Submission updated successfully",
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json({ error: "Failed to update submission" }, { status: 500 });
  }
}

/**
 * DELETE /api/submissions/[id]
 * Delete a submission (requires ownership or admin role)
 */
export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json({ error: "Invalid submission ID" }, { status: 400 });
    }

    // Check if user can delete this submission
    const canDelete = await canDeleteSubmission(userId, id);
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own submissions" },
        { status: 403 },
      );
    }

    const { data: deleted, error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json({ error: "Failed to delete submission" }, { status: 500 });
  }
}
