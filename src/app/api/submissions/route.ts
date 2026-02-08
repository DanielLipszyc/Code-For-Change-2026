import { getDb } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export interface Submission {
  _id?: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
  imageData?: string; // Base64 encoded image
  userId?: string; // Clerk user ID (optional for legacy submissions)
  createdBy?: string; // User's display name
  createdAt?: Date;
  updatedAt?: Date;
  status?: 'pending' | 'approved'; // Approval status (pending = red for admins, approved = green for all)
}

// GET - Fetch all submissions from MongoDB
// All users see all submissions
// Admins see pending (red) vs approved (green) markers
// Regular users see all markers as green
export async function GET() {
  try {
    const db = await getDb();

    // Return all submissions - frontend handles visual differences based on role
    const submissions = await db
      .collection("submissions")
      .find({})
      .sort({ timestamp: -1 })
      .toArray();

    return NextResponse.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return NextResponse.json({ error: "Failed to fetch submissions" }, { status: 500 });
  }
}

// POST - Create new submission in MongoDB (requires authentication)
export async function POST(request: NextRequest) {
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

    // Check if user is admin
    const userRole = (user.publicMetadata.role as string) || 'user';
    const isUserAdmin = userRole === 'admin';

    const data: Submission = await request.json();

    // Validate required fields
    if (!data.plantName || data.lat === undefined || data.lng === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: plantName, lat, lng" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("submissions").insertOne({
      plantName: data.plantName,
      scientificName: data.scientificName || null,
      lat: data.lat,
      lng: data.lng,
      timestamp: data.timestamp || Date.now(),
      notes: data.notes || null,
      imageData: data.imageData || null,
      userId, // Add authenticated user ID
      createdBy: displayName, // Add user's display name
      createdAt: new Date(),
      status: isUserAdmin ? 'approved' : 'pending', // Auto-approve admin submissions, users need approval
    });

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
