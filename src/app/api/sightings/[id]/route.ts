import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { canEditSighting, canDeleteSighting } from "@/lib/auth";

/**
 * GET /api/sightings/[id]
 * Fetch a single sighting by ID (public)
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
        { error: "Invalid sighting ID" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const sighting = await db.collection("sightings").findOne({
      _id: new ObjectId(id),
    });

    if (!sighting) {
      return NextResponse.json(
        { error: "Sighting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sighting);
  } catch (error) {
    console.error("Error fetching sighting:", error);
    return NextResponse.json(
      { error: "Failed to fetch sighting" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sightings/[id]
 * Update a sighting (requires ownership)
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
        { error: "Invalid sighting ID" },
        { status: 400 }
      );
    }

    // Check if user can edit this sighting
    const canEdit = await canEditSighting(userId, id);
    if (!canEdit) {
      return NextResponse.json(
        { error: "Forbidden - You can only edit your own sightings" },
        { status: 403 }
      );
    }

    const body = await request.json();

    // Build update object
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (body.speciesId !== undefined) updateFields.speciesId = body.speciesId;
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.status !== undefined) updateFields.status = body.status;

    const db = await getDb();
    const result = await db.collection("sightings").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Sighting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sighting updated successfully",
    });
  } catch (error) {
    console.error("Error updating sighting:", error);
    return NextResponse.json(
      { error: "Failed to update sighting" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sightings/[id]
 * Delete a sighting (requires ownership or admin role)
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
        { error: "Invalid sighting ID" },
        { status: 400 }
      );
    }

    // Check if user can delete this sighting
    const canDelete = await canDeleteSighting(userId, id);
    if (!canDelete) {
      return NextResponse.json(
        { error: "Forbidden - You can only delete your own sightings" },
        { status: 403 }
      );
    }

    const db = await getDb();
    const result = await db.collection("sightings").deleteOne({
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Sighting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Sighting deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting sighting:", error);
    return NextResponse.json(
      { error: "Failed to delete sighting" },
      { status: 500 }
    );
  }
}
