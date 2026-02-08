import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
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

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const submission = await db.collection("submissions").findOne({
      _id: new ObjectId(id),
    });

    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(submission);
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

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
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
      updatedAt: new Date(),
    };

    if (body.plantName) updateFields.plantName = body.plantName;
    if (body.scientificName !== undefined) updateFields.scientificName = body.scientificName;
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.imageData !== undefined) updateFields.imageData = body.imageData;

    const db = await getDb();
    const result = await db.collection("submissions").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
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

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
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

    const db = await getDb();
    const result = await db.collection("submissions").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
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
