import { supabase, toSubmission } from "@/server/db";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPublicDisplayName, getUserRole, isAdmin } from "@/server/authz";
import { CLERK_USER_ID, createSubmissionSchema } from "@/lib/schemas";
import { MAX_BODY_BYTES, parseJsonBody } from "@/server/http";
import { LIMITS, anonymousKey, isWithinRateLimit, tooManyRequests } from "@/server/rateLimit";

// GET - Fetch submissions from Supabase
// Admins get everything, including pending reports awaiting review.
// Everyone else gets approved reports plus their own pending ones (for My Log);
// other people's Clerk user IDs are removed.
export async function GET() {
  try {
    const { userId } = await auth();
    const admin = userId ? await isAdmin(userId) : false;

    let query = supabase
      .from("submissions")
      .select("*")
      .order("timestamp_ms", { ascending: false });

    if (!admin) {
      // Clerk IDs are [A-Za-z0-9_]; anything else must not reach the filter string
      query =
        userId && CLERK_USER_ID.test(userId)
          ? query.or(`status.eq.approved,user_id.eq.${userId}`)
          : query.eq("status", "approved");
    }

    const { data, error } = await query;
    if (error) throw error;

    const submissions = data
      .map(toSubmission)
      .map((submission) =>
        admin || submission.userId === userId ? submission : { ...submission, userId: null },
      );

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// POST - Create new submission in Supabase
// Requires authentication unless the submission is marked anonymous
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    // Only known species (or "Unknown"), bounded notes and inline photos are stored
    const parsed = await parseJsonBody(request, createSubmissionSchema, MAX_BODY_BYTES.withPhoto);
    if (!parsed.ok) return parsed.response;
    const data = parsed.data;
    const isAnonymous = data.anonymous;

    if (!userId && !isAnonymous) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to submit" },
        { status: 401 },
      );
    }

    // Limit per account, or per IP address for anonymous submissions
    const rateLimit = userId ? LIMITS.submitSignedIn : LIMITS.submitAnonymous;
    const rateKey = userId ? `submit:user:${userId}` : anonymousKey("submit", request);
    if (!(await isWithinRateLimit(rateKey, rateLimit))) {
      return tooManyRequests(rateLimit.windowSeconds);
    }

    let displayName = "Anonymous";
    let userRole: "user" | "admin" = "user";

    // Anonymous submissions get no user attached and are never auto-approved
    if (userId && !isAnonymous) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      displayName = getPublicDisplayName(user, { fallback: "Anonymous" });
      userRole = await getUserRole(userId);
    }

    const { data: inserted, error } = await supabase
      .from("submissions")
      .insert({
        plant_name: data.plantName.plantName,
        scientific_name: data.plantName.scientificName,
        lat: data.lat,
        lng: data.lng,
        location_accuracy_m: data.locationAccuracyM,
        // Spotted now: the form submits on the spot, and clients can't backdate reports
        timestamp_ms: Date.now(),
        notes: data.notes,
        image_data: data.imageData,
        user_id: isAnonymous ? null : userId, // Add authenticated user ID
        created_by: displayName, // Add user's display name
        status: userRole === "admin" ? "approved" : "pending", // Auto-approve admin submissions
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      id: inserted.id,
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
