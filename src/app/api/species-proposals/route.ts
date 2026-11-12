import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabase } from "@/server/db";
import { isAdmin } from "@/server/authz";
import { jsonError, MAX_BODY_BYTES, parseJsonBody } from "@/server/http";
import { isWithinRateLimit, tooManyRequests } from "@/server/rateLimit";

const proposalSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scientificName: z.string().trim().min(3).max(160),
  description: z.string().trim().min(20).max(3000),
  imageUrl: z.union([z.string().trim().url().max(2000).refine((s) => /^https?:\/\//i.test(s)), z.literal("")]).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return jsonError(401, "Sign in to suggest a species");
    const parsed = await parseJsonBody(request, proposalSchema, MAX_BODY_BYTES.small);
    if (!parsed.ok) return parsed.response;
    const limit = { limit: 5, windowSeconds: 3600 };
    if (!(await isWithinRateLimit(`species-proposal:${userId}`, limit))) return tooManyRequests(limit.windowSeconds);
    const input = parsed.data;
    const { data: existing, error: lookupError } = await supabase.from("plants").select("id")
      .ilike("scientific_name", input.scientificName).limit(1);
    if (lookupError) throw lookupError;
    if (existing?.length) return jsonError(409, "This species is already in the catalog");
    const { error } = await supabase.from("species_proposals").insert({
      name: input.name, scientific_name: input.scientificName,
      description: input.description, image_url: input.imageUrl || null,
      submitted_by: userId, status: "pending",
    });
    if (error) throw error;
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Species proposal failed:", error);
    return jsonError(500, "Unable to submit species proposal");
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) return jsonError(403, "Admin access required");
    const { data, error } = await supabase.from("species_proposals")
      .select("id,name,scientific_name,description,image_url,submitted_by,created_at,status")
      .eq("status", "pending").order("created_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unable to load proposals:", error);
    return jsonError(500, "Unable to load proposals");
  }
}
