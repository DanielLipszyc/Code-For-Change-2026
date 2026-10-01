import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UNKNOWN_PLANT } from "@/lib/limits";
import { identifyPlantSchema } from "@/lib/schemas";
import { PLANT_ID_ENABLED } from "@/lib/features";
import { MAX_BODY_BYTES, parseJsonBody } from "@/server/http";
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

    const parsed = await parseJsonBody(request, identifyPlantSchema, MAX_BODY_BYTES.withPhoto);
    if (!parsed.ok) return parsed.response;

    const plant = await identifyPlant(parsed.data.image);

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
