import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { supabase } from "@/server/db";
import { isAdmin } from "@/server/authz";
import { invalidatePlantCache } from "@/server/plants";
import { jsonError, MAX_BODY_BYTES, parseJsonBody } from "@/server/http";

type Context = { params: Promise<{ id: string }> };
const reviewSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("reject") }),
  z.object({
    action: z.literal("approve"),
    threatLevel: z.enum(["Low", "Moderate", "Significant"]),
  }),
]);

export async function PATCH(request: NextRequest, context: Context) {
  try {
    const { userId } = await auth();
    if (!userId || !(await isAdmin(userId))) return jsonError(403, "Admin access required");
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return jsonError(400, "Invalid proposal ID");
    const parsed = await parseJsonBody(request, reviewSchema, MAX_BODY_BYTES.small);
    if (!parsed.ok) return parsed.response;
    const { action } = parsed.data;
    if (action === "reject") {
      const { data, error } = await supabase
        .from("species_proposals")
        .update({
          status: "rejected",
          reviewed_by: userId,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (!data) return jsonError(409, "Proposal already reviewed");
      return NextResponse.json({ success: true });
    }
    // One database transaction prevents duplicate publication and partial approvals.
    const { data, error } = await supabase.rpc("approve_species_proposal", {
      p_proposal_id: id,
      p_reviewer: userId,
      p_threat_level: parsed.data.threatLevel,
    });
    if (error) {
      if (error.code === "23505") return jsonError(409, "Species already exists in catalog");
      if (error.code === "P0002") return jsonError(409, "Proposal already reviewed or missing");
      throw error;
    }
    invalidatePlantCache();
    return NextResponse.json({ success: true, plantId: data });
  } catch (error) {
    console.error("Unable to review species proposal:", error);
    return jsonError(500, "Unable to review species proposal");
  }
}
