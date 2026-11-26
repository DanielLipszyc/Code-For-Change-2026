import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { followSchema } from "@/lib/schemas";
import { listCommunityFeed, toggleFollow } from "@/server/dashboard";
import { MAX_BODY_BYTES, jsonError, parseJsonBody } from "@/server/http";
import { LIMITS, isWithinRateLimit, tooManyRequests } from "@/server/rateLimit";

/** GET /api/dashboard?offset=...: another page of visible community reports. */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError(401, "Unauthorized");
    const value = request.nextUrl.searchParams.get("offset") ?? "0";
    if (
      !/^\d+$/.test(value) ||
      !Number.isSafeInteger(Number(value)) ||
      Number(value) > 2_147_483_626
    ) {
      return jsonError(400, "Invalid offset");
    }
    return NextResponse.json(await listCommunityFeed(userId, Number(value)));
  } catch (error) {
    console.error("Error loading community feed:", error);
    return jsonError(500, "Failed to load community feed");
  }
}

/** POST /api/dashboard: follow or unfollow an observer. */
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
