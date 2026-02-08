import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { auth, clerkClient } from "@clerk/nextjs/server";

const COLLECTION = "sightings";

/**
 * GET /api/sightings
 * Optional query params:
 * ?status=verified
 * ?limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const { searchParams } = new URL(req.url);

    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "100");

    const query: any = {};
    if (status) query.status = status;

    const sightings = await db
      .collection(COLLECTION)
      .find(query)
      .sort({ reportedAt: -1 })
      .limit(limit)
      .toArray();

    return NextResponse.json(sightings);
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

    const db = await getDb();
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

    const doc = {
      speciesId: body.speciesId ?? null,
      lat: body.lat,
      lng: body.lng,
      locationAccuracyM: body.locationAccuracyM,
      addressApprox: body.addressApprox,
      observedAt: body.observedAt
        ? new Date(body.observedAt)
        : new Date(),
      reportedAt: new Date(),
      notes: body.notes || "",
      status: "pending", // moderation default
      userId, // Add authenticated user ID
      createdBy: displayName, // Add user's display name
    };

    const result = await db.collection(COLLECTION).insertOne(doc);

    return NextResponse.json({
      insertedId: result.insertedId,
      ...doc
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to create sighting" },
      { status: 500 }
    );
  }
}
