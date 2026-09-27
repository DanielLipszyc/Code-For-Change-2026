import { getDb } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getUserRole } from "@/lib/auth";

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
    const authResult = await auth();
    const userId = authResult.userId;
    const data: Submission & { anonymous?: boolean } = await request.json();
    const isAnonymousSubmission = Boolean(data.anonymous);

    if (!userId && !isAnonymousSubmission) {
      return NextResponse.json(
        { error: "Unauthorized - Please sign in to submit" },
        { status: 401 }
      );
    }

    let displayName = 'Anonymous';
    let userRole: 'user' | 'admin' = 'user';
    const submissionRecord: Record<string, unknown> = {
      plantName: data.plantName,
      scientificName: data.scientificName || null,
      lat: data.lat,
      lng: data.lng,
      timestamp: data.timestamp || Date.now(),
      notes: data.notes || null,
      imageData: data.imageData || null,
      createdBy: displayName,
      createdAt: new Date(),
      status: 'pending',
    };

    if (userId) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      displayName = user.firstName || user.emailAddresses[0]?.emailAddress || 'Anonymous';
      userRole = await getUserRole(userId);

      if (!isAnonymousSubmission) {
        submissionRecord.userId = userId;
        submissionRecord.createdBy = displayName;
      }
    }

    if (isAnonymousSubmission) {
      submissionRecord.createdBy = 'Anonymous';
    }

    if (userRole === 'admin' && !isAnonymousSubmission) {
      submissionRecord.status = 'approved';
    }

    // Validate required fields
    if (!data.plantName || data.lat === undefined || data.lng === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: plantName, lat, lng" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.collection("submissions").insertOne(submissionRecord);

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString()
    });
  } catch (error) {
    console.error("Error creating submission:", error);
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }
}
