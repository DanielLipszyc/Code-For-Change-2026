import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { supabase, isValidId } from "@/lib/supabase";
import { isAdmin } from "@/lib/auth";

/**
 * POST /api/submissions/[id]/approve
 * Approve a pending submission (admin only)
 */
export async function POST(
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

    // Check if user is admin
    const userIsAdmin = await isAdmin(userId);
    if (!userIsAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Only admins can approve submissions" },
        { status: 403 }
      );
    }

    // Validate ID
    if (!isValidId(id)) {
      return NextResponse.json(
        { error: "Invalid submission ID" },
        { status: 400 }
      );
    }

    const { data: updated, error } = await supabase
      .from("submissions")
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: userId,
      })
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
      message: "Submission approved successfully",
    });
  } catch (error) {
    console.error("Error approving submission:", error);
    return NextResponse.json(
      { error: "Failed to approve submission" },
      { status: 500 }
    );
  }
}
