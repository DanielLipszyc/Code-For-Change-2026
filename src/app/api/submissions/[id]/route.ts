import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isValidId, toSubmission } from "@/lib/supabase";
import { canEditSubmission, canDeleteSubmission, isAdmin } from "@/lib/auth";
import { parseNotes, resolvePlant } from "@/lib/submissionInput";

/**
 * GET /api/submissions/[id]
 * Fetch a single submission by ID. Approved submissions are public;
 * pending ones are visible only to their owner and admins.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    const { data: submission, error } = await supabase
      .from("submissions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const { userId } = await auth();
    const isOwner = !!userId && submission.user_id === userId;
    const canSeeAll = isOwner || (!!userId && (await isAdmin(userId)));

    // Pending reports answer 404 to everyone else, so their existence isn't revealed
    if (submission.status !== "approved" && !canSeeAll) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    const result = toSubmission(submission);
    return NextResponse.json(canSeeAll ? result : { ...result, userId: null });
  } catch (error) {
    console.error("Error fetching submission:", error);
    return NextResponse.json(
      { error: "Failed to fetch submission" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/submissions/[id]
 * Update a submission (requires ownership)
 */
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    // Check if user can edit this submission
    const canEdit = await canEditSubmission(userId, id);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own submissions" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Build update object (only the plant and notes can be edited; the photo,
    // location and scientific name are not taken from the client)
    const updateFields: Record<string, string | null> = {
      updated_at: new Date().toISOString(),
    };

    if (body.plantName !== undefined) {
      const plant = resolvePlant(body.plantName);
      if (!plant) {
        return NextResponse.json(
          { error: "Plant name must be one of the listed species or Unknown" },
          { status: 400 }
        );
      }
      updateFields.plant_name = plant.plantName;
      updateFields.scientific_name = plant.scientificName;
    }

    if (body.notes !== undefined) {
      const notes = parseNotes(body.notes);
      if ("error" in notes) {
        return NextResponse.json({ error: notes.error }, { status: 400 });
      }
      updateFields.notes = notes.value;
    }

    if (!("plant_name" in updateFields) && !("notes" in updateFields)) {
      return NextResponse.json(
        { error: "Nothing to update: send plantName and/or notes" },
        { status: 400 }
      );
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
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission updated successfully",
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    return NextResponse.json(
      { error: "Failed to update submission" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/submissions/[id]
 * Delete a submission (requires ownership or admin role)
 */
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    // Check if user can delete this submission
    const canDelete = await canDeleteSubmission(userId, id);
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own submissions" },
        { status: 403 }
      );
    }

    const { data: deleted, error } = await supabase
      .from("submissions")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Submission deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    return NextResponse.json(
      { error: "Failed to delete submission" },
      { status: 500 }
    );
  }
}
