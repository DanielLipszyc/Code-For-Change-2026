import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isValidId, toSighting } from "@/lib/supabase";
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

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid sighting ID" },
        { status: 400 }
      );
    }

    const { data: sighting, error } = await supabase
      .from("sightings")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;

    if (!sighting) {
      return NextResponse.json(
        { error: "Sighting not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(toSighting(sighting));
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

    // Validate ID
    if (!isValidId(id)) {
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
      updated_at: new Date().toISOString(),
    };

    if (body.speciesId !== undefined) updateFields.species_id = body.speciesId;
    if (body.notes !== undefined) updateFields.notes = body.notes;
    if (body.status !== undefined) updateFields.status = body.status;

    const { data: updated, error } = await supabase
      .from("sightings")
      .update(updateFields)
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (updated.length === 0) {
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

    // Validate ID
    if (!isValidId(id)) {
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

    const { data: deleted, error } = await supabase
      .from("sightings")
      .delete()
      .eq("id", id)
      .select("id");

    if (error) throw error;

    if (deleted.length === 0) {
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
