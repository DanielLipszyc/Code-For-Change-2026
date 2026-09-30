import { supabase, toSubmission } from "@/lib/supabase";
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

// GET - Fetch all submissions from Supabase
// All users see all submissions
// Admins see pending (red) vs approved (green) markers
// Regular users see all markers as green
export async function GET() {
  try {
    // Return all submissions - frontend handles visual differences based on role
    const { data, error } = await supabase
      .from("submissions")
      .select("*")
      .order("timestamp_ms", { ascending: false });

    if (error) throw error;

    return NextResponse.json(data.map(toSubmission));
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

    let displayName = 'Anonymous';
    let userRole: 'user' | 'admin' = 'user';

    // Anonymous submissions get no user attached and are never auto-approved
    if (userId && !isAnonymous) {
      const client = await clerkClient();
      const user = await client.users.getUser(userId);
      displayName = user.firstName || user.emailAddresses[0]?.emailAddress || 'Anonymous';
      userRole = await getUserRole(userId);
    }

    // Validate required fields
    if (!data.plantName || data.lat === undefined || data.lng === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: plantName, lat, lng" },
        { status: 400 }
      );
    }

    const { data: inserted, error } = await supabase
      .from("submissions")
      .insert({
        plant_name: data.plantName,
        scientific_name: data.scientificName || null,
        lat: data.lat,
        lng: data.lng,
        timestamp_ms: data.timestamp || Date.now(),
        notes: data.notes || null,
        image_data: data.imageData || null,
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
