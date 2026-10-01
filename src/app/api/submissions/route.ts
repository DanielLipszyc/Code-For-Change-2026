import { supabase, toSubmission } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPublicDisplayName, getUserRole, isAdmin } from "@/lib/auth";
import { parseImageData, parseNotes, resolvePlant } from "@/lib/submissionInput";
import { LIMITS, anonymousKey, isWithinRateLimit, tooManyRequests } from "@/lib/rateLimit";

const CLERK_ID = /^[A-Za-z0-9_]+$/;

export interface Submission {
  _id?: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  locationAccuracyM?: number; // GPS accuracy radius in meters
  timestamp: number;
  notes?: string;
  imageData?: string; // Base64 encoded image
  userId?: string; // Clerk user ID (optional for legacy submissions)
  createdBy?: string; // User's display name
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'pending' | 'approved'; // Approval status (pending = red for admins, approved = green for all)
}

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
        userId && CLERK_ID.test(userId)
          ? query.or(`status.eq.approved,user_id.eq.${userId}`)
          : query.eq("status", "approved");
    }

    const { data, error } = await query;
    if (error) throw error;

    const submissions = data.map(toSubmission).map((submission) =>
      admin || submission.userId === userId ? submission : { ...submission, userId: null }
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
    const authResult = await auth();
    const userId = authResult.userId;
    const data: Submission & { anonymous?: boolean } = await request.json();
    const isAnonymous = Boolean(data.anonymous);

    if (!userId && !isAnonymous) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to submit" },
        { status: 401 }
      );
    }

    // Limit per account, or per IP address for anonymous submissions
    const rateLimit = userId ? LIMITS.submitSignedIn : LIMITS.submitAnonymous;
    const rateKey = userId ? `submit:user:${userId}` : anonymousKey("submit", request);
    if (!(await isWithinRateLimit(rateKey, rateLimit))) {
      return tooManyRequests(rateLimit.windowSeconds);
    }

    let displayName = 'Anonymous';
    let userRole: 'user' | 'admin' = 'user';

    // Anonymous submissions get no user attached and are never auto-approved
    if (userId && !isAnonymous) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      displayName = getPublicDisplayName(user, { fallback: 'Anonymous' });
      userRole = await getUserRole(userId);
    }

    // Validate required fields
    if (!data.plantName || typeof data.lat !== "number" || typeof data.lng !== "number") {
      return NextResponse.json(
        { error: "Missing required fields: plantName, lat, lng" },
        { status: 400 }
      );
    }

    // Only known species (or "Unknown") and bounded notes are stored
    const plant = resolvePlant(data.plantName);
    if (!plant) {
      return NextResponse.json(
        { error: "Plant name must be one of the listed species or Unknown" },
        { status: 400 }
      );
    }

    const notes = parseNotes(data.notes);
    if ("error" in notes) {
      return NextResponse.json({ error: notes.error }, { status: 400 });
    }

    const image = parseImageData(data.imageData);
    if ("error" in image) {
      return NextResponse.json({ error: image.error }, { status: 400 });
    }

    // Rough Alachua County bounds check
    if (
      data.lat < 29.3 || data.lat > 29.9 ||
      data.lng < -82.7 || data.lng > -82.0
    ) {
      return NextResponse.json(
        { error: "Location must be within Alachua County" },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabase
      .from("submissions")
      .insert({
        plant_name: plant.plantName,
        scientific_name: plant.scientificName,
        lat: data.lat,
        lng: data.lng,
        location_accuracy_m:
          typeof data.locationAccuracyM === "number" ? data.locationAccuracyM : null,
        timestamp_ms: data.timestamp || Date.now(),
        notes: notes.value,
        image_data: image.value,
        user_id: isAnonymous ? null : userId, // Add authenticated user ID
        created_by: displayName, // Add user's display name
        status: userRole === 'admin' ? 'approved' : 'pending', // Auto-approve admin submissions
      })
      .select("id")
      .single();

    if (error) throw error;

    return NextResponse.json({
      success: true,
      id: inserted.id
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
