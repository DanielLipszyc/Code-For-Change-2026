import { NextRequest, NextResponse } from "next/server";
import { supabase, toSighting } from "@/lib/supabase";
import { auth, clerkClient } from "@clerk/nextjs/server";

const TABLE = "sightings";

/**
 * GET /api/sightings
 * Optional query params:
 * ?status=verified
 * ?limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    let query = supabase
      .from(TABLE)
      .select("*")
      .order("reported_at", { ascending: false })
      .limit(limit);

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json(data.map(toSighting));
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to fetch sightings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sightings (requires authentication)
 * Body:
 * {
 *   speciesId?: string | null,
 *   lat: number,
 *   lng: number,
 *   locationAccuracyM?: number,
 *   addressApprox?: string,
 *   observedAt?: string,
 *   notes?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await auth();
    const userId = authResult.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to submit" },
        { status: 401 }
      );
    }

    // Get user info from Clerk
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const displayName = user.firstName || user.emailAddresses[0]?.emailAddress || 'Anonymous';

    const body = await req.json();

    // Basic validation
    if (
      typeof body.lat !== "number" ||
      typeof body.lng !== "number"
    ) {
      return NextResponse.json(
        { error: "lat and lng are required numbers" },
        { status: 400 }
      );
    }

    // Optional: rough Alachua County bounds check
    if (
      body.lat < 29.3 || body.lat > 29.9 ||
      body.lng < -82.7 || body.lng > -82.0
    ) {
      return NextResponse.json(
        { error: "Location must be within Alachua County" },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabase
      .from(TABLE)
      .insert({
        species_id: body.speciesId ?? null,
        lat: body.lat,
        lng: body.lng,
        location_accuracy_m: body.locationAccuracyM ?? null,
        address_approx: body.addressApprox ?? null,
        observed_at: body.observedAt
          ? new Date(body.observedAt).toISOString()
          : new Date().toISOString(),
        reported_at: new Date().toISOString(),
        notes: body.notes || "",
        status: "pending", // moderation default
        user_id: userId, // Add authenticated user ID
        created_by: displayName, // Add user's display name
      })
      .select("*")
      .single();

    if (error) throw error;

    return NextResponse.json({
      insertedId: inserted.id,
      ...toSighting(inserted)
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create sighting" },
      { status: 500 }
    );
  }
}
