import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { followSchema } from "@/lib/schemas";
import { getDashboard, toggleFollow } from "@/server/dashboard";
import { MAX_BODY_BYTES, jsonError, parseJsonBody } from "@/server/http";
import { LIMITS, isWithinRateLimit, tooManyRequests } from "@/server/rateLimit";

/** GET /api/dashboard: the signed-in user's dashboard */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError(401, "Unauthorized");

    return NextResponse.json(await getDashboard(userId));
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return jsonError(500, "Failed to load dashboard");
  }
}

/** POST /api/dashboard: follow or unfollow an observer */
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
