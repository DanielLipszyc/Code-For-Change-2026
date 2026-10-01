import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabase, toSubmission } from "@/server/db";
import { getPublicDisplayName } from "@/server/authz";
import { plants } from "@/data/plants";
import { followSchema } from "@/lib/schemas";
import { MAX_BODY_BYTES, parseJsonBody } from "@/server/http";

async function getUserName(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return getPublicDisplayName(user, { includeLastName: true });
  } catch {
    return "Observer";
  }
}

async function getUserMap(userIds: string[]) {
  if (!userIds.length) return new Map<string, { id: string; name: string; imageUrl?: string }>();

  const client = await clerkClient();
  const userEntries = await Promise.all(
    userIds.map(async (userId) => {
      try {
        const user = await client.users.getUser(userId);
        return {
          id: userId,
          name: getPublicDisplayName(user, { includeLastName: true }),
          imageUrl: user.imageUrl,
        };
      } catch {
        return {
          id: userId,
          name: "Observer",
          imageUrl: "",
        };
      }
    }),
  );

  return new Map(userEntries.map((user) => [user.id, user]));
}

function getActivityTone(label: string) {
  if (label.toLowerCase().includes("observation")) return "emerald";
  if (label.toLowerCase().includes("species")) return "sky";
  if (label.toLowerCase().includes("rank")) return "orange";
  return "violet";
}

function toSafeDate(value: unknown): Date | null {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof value === "object" && value && "toString" in value) {
    const parsed = new Date(String(value));
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export async function GET() {
  try {
    const authResult = await auth();
    const currentUserId = authResult.userId;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: submissionRows, error: submissionsError } = await supabase
      .from("submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .order("timestamp_ms", { ascending: false });

    if (submissionsError) throw submissionsError;
    const submissions = submissionRows.map(toSubmission);

    const currentUserSubmissions = submissions.filter(
      (submission) => submission.userId === currentUserId,
    );
    // Other people's pending reports haven't been reviewed; keep them out of the observers list and feed
    const visibleSubmissions = submissions.filter(
      (submission) => submission.status === "approved" || submission.userId === currentUserId,
    );
    const uniqueObserverIds = Array.from(
      new Set(
        visibleSubmissions
          .map((submission) => submission.userId)
          .filter((userId): userId is string => Boolean(userId) && userId !== currentUserId),
      ),
    ).slice(0, 8);

    const userMap = await getUserMap(uniqueObserverIds);
    const { data: followingRows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (followsError) throw followsError;
    const followingIds = new Set(followingRows.map((row) => row.following_id));

    const currentTotal = currentUserSubmissions.length;
    const approvedCount = currentUserSubmissions.filter(
      (submission) => submission.status === "approved",
    ).length;
    // Listed species only: "Unknown Plant" has no scientific name
    const uniqueSpecies = new Set(
      currentUserSubmissions.map((submission) => submission.scientificName).filter(Boolean),
    ).size;
    const fieldDays = new Set(
      currentUserSubmissions
        .map((submission) => {
          const createdAt = submission.createdAt ?? submission.timestamp;
          const date = toSafeDate(createdAt);
          if (!date) return null;
          return date.toISOString().slice(0, 10);
        })
        .filter(Boolean),
    ).size;

    // Rank by approved reports: 1 + the number of observers with more than you
    const approvedByObserver = new Map<string, number>();
    for (const submission of submissions) {
      if (submission.status === "approved" && submission.userId) {
        approvedByObserver.set(
          submission.userId,
          (approvedByObserver.get(submission.userId) ?? 0) + 1,
        );
      }
    }
    const rank =
      1 + Array.from(approvedByObserver.values()).filter((count) => count > approvedCount).length;

    const observers = uniqueObserverIds
      .map((observerId) => {
        const observerEntries = visibleSubmissions.filter(
          (submission) => submission.userId === observerId,
        );
        const observerInfo = userMap.get(observerId) ?? {
          id: observerId,
          name: "Observer",
          imageUrl: "",
        };

        return {
          id: observerId,
          name: observerInfo.name,
          focus: observerEntries[0]?.plantName || "Field tracking",
          sightings: observerEntries.length,
          following: followingIds.has(observerId),
          avatar: (observerInfo.name || "O").slice(0, 2).toUpperCase(),
          imageUrl: observerInfo.imageUrl || "",
        };
      })
      .sort((a, b) => b.sightings - a.sightings)
      .slice(0, 4);

    const stats = [
      {
        label: "Observations",
        value: currentTotal.toString(),
        detail: `${approvedCount} approved`,
        tone: getActivityTone("Observations"),
      },
      {
        label: "Species logged",
        value: uniqueSpecies.toString(),
        detail: `of ${plants.length} tracked species`,
        tone: getActivityTone("Species"),
      },
      {
        label: "Community rank",
        value: approvedCount > 0 ? `#${rank}` : "—",
        detail:
          approvedCount > 0
            ? `of ${approvedByObserver.size} observers`
            : "Get a report approved to rank",
        tone: getActivityTone("Rank"),
      },
      {
        label: "Field days",
        value: fieldDays.toString(),
        detail: "Days with a report",
        tone: getActivityTone("Field days"),
      },
    ];

    const achievements = [
      {
        title: "Trail Recon",
        detail: `${Math.min(currentTotal, 5)} of 5 field checks logged`,
        progress: Math.min((currentTotal / 5) * 100, 100),
        icon: "🥾",
      },
      {
        title: "Wetland Watcher",
        detail: `${Math.min(approvedCount, 12)} of 12 approved reports`,
        progress: Math.min((approvedCount / 12) * 100, 100),
        icon: "💧",
      },
      {
        title: "Plant Detective",
        detail: `${uniqueSpecies} of ${plants.length} species found`,
        progress: (uniqueSpecies / plants.length) * 100,
        icon: "🔍",
      },
    ];

    const feed = visibleSubmissions.slice(0, 3).map((submission) => {
      const observerName = submission.createdBy || (submission.userId ? "Observer" : "Community");
      const submissionName = submission.plantName || "plant report";
      const eventDate =
        toSafeDate(submission.createdAt ?? submission.timestamp ?? new Date()) ?? new Date();

      return {
        title: `${observerName} logged ${submissionName}`,
        meta: `${eventDate.toLocaleDateString()} · ${submission.status || "pending"}`,
        type: submission.userId === currentUserId ? "connection" : "species",
      };
    });

    const user = {
      id: currentUserId,
      name: await getUserName(currentUserId),
    };

    return NextResponse.json({
      user,
      stats,
      observers,
      achievements,
      feed,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return NextResponse.json({ error: "Failed to load dashboard" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authResult = await auth();
    const currentUserId = authResult.userId;

    if (!currentUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = await parseJsonBody(request, followSchema, MAX_BODY_BYTES.small);
    if (!parsed.ok) return parsed.response;
    const { targetUserId } = parsed.data;

    if (targetUserId === currentUserId) {
      return NextResponse.json({ error: "A valid observer ID is required" }, { status: 400 });
    }

    const { data: existingFollow, error: lookupError } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", targetUserId)
      .maybeSingle();

    if (lookupError) throw lookupError;

    if (existingFollow) {
      const { error: deleteError } = await supabase
        .from("follows")
        .delete()
        .eq("id", existingFollow.id);

      if (deleteError) throw deleteError;
      return NextResponse.json({ following: false });
    }

    const { error: insertError } = await supabase.from("follows").insert({
      follower_id: currentUserId,
      following_id: targetUserId,
    });

    if (insertError) throw insertError;

    return NextResponse.json({ following: true });
  } catch (error) {
    console.error("Error updating follow state:", error);
    return NextResponse.json({ error: "Failed to update follow state" }, { status: 500 });
  }
}
