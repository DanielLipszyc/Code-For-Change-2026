import { NextRequest, NextResponse } from "next/server";
import { plantNames, plants } from "@/data/plants";

// Helper function to call Gemini once
async function callGemini(apiKey: string, mimeType: string, base64Data: string, plantList: string) {
  const prompt = `You are an invasive plant identifier. Look at this image and classify it as ONE of these 17 invasive species:

${plantList}

You MUST respond with EXACTLY one name from this list - no other options allowed.
If unsure, pick the closest match from the list.

Reply with ONLY the plant name, nothing else.`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inline_data: { mime_type: mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { temperature: 0.1, maxOutputTokens: 100 },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Gemini API error:", JSON.stringify(errorData, null, 2));
      return null;
    }

    const data = await response.json();
    console.log("Gemini response:", JSON.stringify(data, null, 2));
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

    // Clean up the response - remove any extra text
    const prediction = rawText.split("\n")[0].trim();

    return { prediction };
  } catch (error) {
    console.error("Gemini fetch error:", error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  console.log("=== Plant identification API called ===");
  
  try {
    const { image } = await request.json();
    console.log("Image received, length:", image?.length || 0);

    if (!image) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    console.log("API Key exists:", !!apiKey, "Length:", apiKey?.length);
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
    const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || "image/jpeg";
    const plantList = plantNames.map((name, i) => `${i + 1}. ${name}`).join("\n");
    console.log("Base64 length:", base64Data.length, "Mime:", mimeType);

    // Call Gemini API
    const result = await callGemini(apiKey, mimeType, base64Data, plantList);
    
    if (!result) {
      return NextResponse.json({ error: "Failed to analyze image" }, { status: 500 });
    }

    // Try exact match first, then partial match
    const predictionLower = result.prediction.toLowerCase().trim();
    let matchedPlant = plants.find(
      (p) => p.name.toLowerCase() === predictionLower
    );
    
    // If no exact match, try partial match (plant name contains or is contained in prediction)
    if (!matchedPlant) {
      matchedPlant = plants.find(
        (p) => predictionLower.includes(p.name.toLowerCase()) || 
               p.name.toLowerCase().includes(predictionLower)
      );
    }

    // Use the matched plant name if found, otherwise use AI's response
    const finalPrediction = matchedPlant ? matchedPlant.name : result.prediction;

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
