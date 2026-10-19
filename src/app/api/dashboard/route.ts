import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { followSchema } from "@/lib/schemas";
import { toggleFollow } from "@/server/dashboard";
import { MAX_BODY_BYTES, jsonError, parseJsonBody } from "@/server/http";
import { LIMITS, isWithinRateLimit, tooManyRequests } from "@/server/rateLimit";

/**
 * POST /api/dashboard: follow or unfollow an observer.
 * (The dashboard's data is loaded by its page on the server.)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError(401, "Unauthorized");

    const parsed = await parseJsonBody(request, followSchema, MAX_BODY_BYTES.small);
    if (!parsed.ok) return parsed.response;
    const { targetUserId } = parsed.data;

    if (targetUserId === userId) return jsonError(400, "You can't follow yourself");

    if (!(await isWithinRateLimit(`follow:user:${userId}`, LIMITS.follow))) {
      return tooManyRequests(LIMITS.follow.windowSeconds);
    }

    return NextResponse.json({ following: await toggleFollow(userId, targetUserId) });
  } catch (error) {
    console.error("Error updating follow state:", error);
    return jsonError(500, "Failed to update follow state");
  }
}
