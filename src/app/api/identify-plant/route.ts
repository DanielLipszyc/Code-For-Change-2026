import { NextRequest, NextResponse } from "next/server";
import { plantNames } from "@/data/plants";

export async function POST(request: NextRequest) {
  console.log("=== Plant identification API called ===");
  
  try {
    const { image } = await request.json();
    console.log("Image received, length:", image?.length || 0);

    if (!image) {
      console.log("No image provided");
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key exists:", !!apiKey);
    
    if (!apiKey) {
      console.log("Gemini API key not configured");
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    // Extract base64 data from data URL
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";

    // Create the prompt with the list of known plants
    const plantList = plantNames.join(", ");
    const prompt = `You are a plant identification expert specializing in invasive wetland and swamp plants. 
    
Analyze this image and identify the plant. Compare it against these known invasive species: ${plantList}.

If the plant matches one of these species, respond with ONLY the exact name from the list.
If the plant does not match any of these species, respond with "Unknown" followed by your best guess of what the plant might be.

Important: Only respond with the plant name, nothing else.`;

    // Call Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64Data,
                  },
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 100,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json(
        { error: "Failed to analyze image", details: errorData },
        { status: 500 }
      );
    }

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));
    const prediction =
      data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "Unknown";

    // Check if the prediction matches a known plant
    const isKnownPlant = plantNames.some(
      (name) => name.toLowerCase() === prediction.toLowerCase()
    );

    return NextResponse.json({
      prediction,
      isKnownPlant,
      confidence: isKnownPlant ? "high" : "low",
    });
  } catch (error) {
    console.error("Error identifying plant:", error);
    return NextResponse.json(
      { error: "Failed to process image" },
      { status: 500 }
    );
  }
}
