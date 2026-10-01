import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createSubmissionSchema } from "@/lib/schemas";
import { getPublicDisplayName, getViewer, roleOf } from "@/server/authz";
import { MAX_BODY_BYTES, jsonError, parseJsonBody } from "@/server/http";
import { LIMITS, anonymousKey, isWithinRateLimit, tooManyRequests } from "@/server/rateLimit";
import { createSubmission, listSubmissions } from "@/server/submissions";

/**
 * GET /api/submissions
 * Admins get everything; everyone else gets approved reports plus their own
 * pending ones. With ?mine=1, only the caller's own submissions.
 */
export async function GET(request: NextRequest) {
  try {
    const viewer = await getViewer();
    const mine = request.nextUrl.searchParams.get("mine") === "1";
    return NextResponse.json(await listSubmissions(viewer, { mine }));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return jsonError(500, "Failed to fetch submissions");
  }
}

/**
 * POST /api/submissions
 * Requires sign-in unless the submission is marked anonymous.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    const parsed = await parseJsonBody(request, createSubmissionSchema, MAX_BODY_BYTES.withPhoto);
    if (!parsed.ok) return parsed.response;
    const input = parsed.data;

    if (!userId && !input.anonymous) {
      return jsonError(401, "Unauthorized - Please sign in to submit");
    }

    // Limit per account, or per IP address for anonymous submissions
    const rateLimit = userId ? LIMITS.submitSignedIn : LIMITS.submitAnonymous;
    const rateKey = userId ? `submit:user:${userId}` : anonymousKey("submit", request);
    if (!(await isWithinRateLimit(rateKey, rateLimit))) {
      return tooManyRequests(rateLimit.windowSeconds);
    }

    // Anonymous submissions get no user attached and are never auto-approved
    let submitter = { userId: null as string | null, displayName: "Anonymous", autoApprove: false };
    if (userId && !input.anonymous) {
      const user = await (await clerkClient()).users.getUser(userId);
      submitter = {
        userId,
        displayName: getPublicDisplayName(user, { fallback: "Anonymous" }),
        // Admins' own reports skip review
        autoApprove: roleOf(user) === "admin",
      };
    }

    const id = await createSubmission(input, submitter);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error("Error creating submission:", error);
    return jsonError(500, "Failed to create submission");
  }
}
