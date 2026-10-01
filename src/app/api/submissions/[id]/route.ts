import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isValidId, toSubmission } from "@/lib/supabase";
import { canEditSubmission, canDeleteSubmission } from "@/lib/auth";

/**
 * GET /api/submissions/[id]
 * Fetch a single submission by ID (public)
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

    return NextResponse.json(toSubmission(submission));
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

    // Build update object (only allow certain fields to be updated)
    const updateFields: any = {
      updated_at: new Date().toISOString(),
    };

    if (body.plantName) updateFields.plant_name = body.plantName;
    if (body.scientificName !== undefined) updateFields.scientific_name = body.scientificName;
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.imageData !== undefined) updateFields.image_data = body.imageData;

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
