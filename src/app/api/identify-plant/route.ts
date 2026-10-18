import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { plants } from "@/data/plants";
import { UNKNOWN_PLANT } from "@/lib/submissionInput";
import { LIMITS, isWithinRateLimit, tooManyRequests } from "@/lib/rateLimit";
import { PLANT_ID_ENABLED } from "@/lib/features";

interface ModalScore {
  name: string;
  scientificName?: string;
  confidence: number;
}

function isModalScore(value: unknown): value is ModalScore {
  if (typeof value !== "object" || value === null) return false;

  const score = value as Record<string, unknown>;
  return (
    typeof score.name === "string" &&
    score.name.length > 0 &&
    (typeof score.scientificName === "string" || score.scientificName === undefined) &&
    typeof score.confidence === "number" &&
    Number.isFinite(score.confidence)
  );
}

async function callModal(modalUrl: string, image: string): Promise<ModalScore[] | null> {
  try {
    const response = await fetch(modalUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });

    if (!response.ok) {
      console.error("Modal API error:", await response.text());
      return null;
    }

    const data: unknown = await response.json();
    if (typeof data !== "object" || data === null) return [];

    const scores = (data as Record<string, unknown>).scores;
    if (!Array.isArray(scores)) return [];

    return scores
      .filter(isModalScore)
      .sort((first, second) => second.confidence - first.confidence);
  } catch (error) {
    console.error("Modal fetch error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  if (!PLANT_ID_ENABLED) {
    return NextResponse.json({ error: "Plant identification is turned off" }, { status: 404 });
  }

  console.log("=== Plant identification API called ===");

  // Checked here as well as in middleware, so a middleware bypass can't spend Gemini quota
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
  }

  try {
    // Each call costs Gemini quota
    if (!(await isWithinRateLimit(`identify:user:${userId}`, LIMITS.identifyPlant))) {
      return tooManyRequests(LIMITS.identifyPlant.windowSeconds);
    }

    const { image } = await request.json();
    if (typeof image !== "string" || !image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const modalUrl = process.env.MODAL_BIO_CLIP_URL;
    if (!modalUrl) {
      return NextResponse.json({ error: "Modal endpoint URL not configured" }, { status: 500 });
    }

    const scores = await callModal(modalUrl, image);
    if (!scores?.length) {
      return NextResponse.json({ error: "Failed to analyze image" }, { status: 502 });
    }

    const topScore = scores[0];
    const topName = topScore.name.toLowerCase().trim();
    const topScientificName = topScore.scientificName?.toLowerCase().trim();
    const matchedPlant = plants.find(
      (plant) =>
        plant.name.toLowerCase() === topName ||
        plant.scientificName.toLowerCase() === topScientificName,
    );

    const finalPrediction = matchedPlant ? matchedPlant.name : UNKNOWN_PLANT;

    return NextResponse.json({
      prediction: finalPrediction,
      scientificName: matchedPlant?.scientificName || null,
      isKnownPlant: !!matchedPlant,
    });
  } catch (error) {
    console.error("Error identifying plant:", error);
    return NextResponse.json({ error: "Failed to process image" }, { status: 500 });
  }
}
