import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/server/authz";
import { jsonError } from "@/server/http";
import { approveSubmission, isValidId } from "@/server/submissions";

/**
 * POST /api/submissions/[id]/approve
 * Approve a pending submission (admins only)
 */
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;

    const { userId } = await auth();
    if (!userId) return jsonError(401, "Unauthorized - Please sign in");

    // Checked live with Clerk rather than from the session token
    if (!(await isAdmin(userId))) {
      return jsonError(403, "Forbidden - Only admins can approve submissions");
    }

    if (!isValidId(id)) return jsonError(400, "Invalid submission ID");

    if (!(await approveSubmission(id, userId))) {
      return jsonError(404, "Submission not found");
    }

    return NextResponse.json({ success: true, message: "Submission approved successfully" });
  } catch (error) {
    console.error("Error approving submission:", error);
    return jsonError(500, "Failed to approve submission");
  }
}
