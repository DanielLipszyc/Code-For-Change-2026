import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UNKNOWN_PLANT } from "@/lib/submissionInput";
import { PLANT_ID_ENABLED } from "@/lib/features";
import { identifyPlant } from "@/server/identify";
import { LIMITS, isWithinRateLimit, tooManyRequests } from "@/server/rateLimit";

export async function POST(request: NextRequest) {
  if (!PLANT_ID_ENABLED) {
    return NextResponse.json({ error: "Plant identification is turned off" }, { status: 404 });
  }

  // Checked here as well as in middleware, so a middleware bypass can't spend model quota
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
  }

  try {
    // Each call runs the model on a GPU
    if (!(await isWithinRateLimit(`identify:user:${userId}`, LIMITS.identifyPlant))) {
      return tooManyRequests(LIMITS.identifyPlant.windowSeconds);
    }

    const { image } = await request.json();
    if (typeof image !== "string" || !image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const plant = await identifyPlant(image);

    return NextResponse.json({
      prediction: plant?.name ?? UNKNOWN_PLANT,
      scientificName: plant?.scientificName ?? null,
      isKnownPlant: !!plant,
    });
  } catch (error) {
    console.error("Error identifying plant:", error);
    return NextResponse.json({ error: "Failed to analyze image" }, { status: 502 });
  }
}
