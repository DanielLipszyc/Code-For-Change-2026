import { getDb } from "@/lib/mongodb";
import { NextRequest, NextResponse } from "next/server";

export interface Submission {
  _id?: string;
  plantName: string;
  scientificName?: string;
  lat: number;
  lng: number;
  timestamp: number;
  notes?: string;
}

// GET - Fetch all submissions from MongoDB
export async function GET() {
  try {
    const db = await getDb();
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

// POST - Create new submission in MongoDB
export async function POST(request: NextRequest) {
  try {
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
      createdAt: new Date(),
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
