import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { supabase, toSubmission } from "@/lib/supabase";
import { getPublicDisplayName } from "@/lib/auth";

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
    })
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

const fallbackDashboard = {
  user: { id: "local-user", name: "Observer" },
  stats: [
    { label: "Observations", value: "12", detail: "3 approved", tone: "emerald" },
    { label: "Species logged", value: "7", detail: "2 new IDs", tone: "sky" },
    { label: "Community rank", value: "#12", detail: "Building momentum", tone: "orange" },
    { label: "Streak", value: "4d", detail: "Active field days", tone: "violet" },
  ],
  observers: [
    { id: "obs-1", name: "Mara Rivers", focus: "Wetland grasses", sightings: 18, following: true, avatar: "MR" },
    { id: "obs-2", name: "Theo Palm", focus: "Invasive trees", sightings: 13, following: false, avatar: "TP" },
    { id: "obs-3", name: "Iris North", focus: "Aquatic plants", sightings: 9, following: true, avatar: "IN" },
  ],
  achievements: [
    { title: "Trail Recon", detail: "3 of 5 field checks logged", progress: 60, icon: "🥾" },
    { title: "Wetland Watcher", detail: "7 of 12 water-site reports", progress: 58, icon: "💧" },
    { title: "Plant Detective", detail: "7 of 18 species confirmed", progress: 39, icon: "🔍" },
  ],
  feed: [
    { title: "Mara Rivers logged cattail marsh observations", meta: "Today · 3 reports", type: "species" },
    { title: "Community challenge: map invasive stands", meta: "2 days ago · 18 observers active", type: "challenge" },
    { title: "You logged a new wetland report", meta: "3 days ago · approved", type: "connection" },
  ],
};

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

    const currentUserSubmissions = submissions.filter((submission) => submission.userId === currentUserId);
    // Other people's pending reports haven't been reviewed; keep them out of the observers list and feed
    const visibleSubmissions = submissions.filter(
      (submission) => submission.status === "approved" || submission.userId === currentUserId
    );
    const uniqueObserverIds = Array.from(
      new Set(
        visibleSubmissions
          .map((submission) => submission.userId)
          .filter((userId): userId is string => Boolean(userId) && userId !== currentUserId)
      )
    ).slice(0, 8);

    const userMap = await getUserMap(uniqueObserverIds);
    const { data: followingRows, error: followsError } = await supabase
      .from("follows")
      .select("following_id")
      .eq("follower_id", currentUserId);

    if (followsError) throw followsError;
    const followingIds = new Set(followingRows.map((row) => row.following_id));

    const currentTotal = currentUserSubmissions.length;
    const approvedCount = currentUserSubmissions.filter((submission) => submission.status === "approved").length;
    const uniqueSpecies = new Set(
      currentUserSubmissions
        .map((submission) => submission.scientificName || submission.plantName)
        .filter(Boolean)
    ).size;
    const recentDays = new Set(
      currentUserSubmissions
        .map((submission) => {
          const createdAt = submission.createdAt ?? submission.timestamp;
          const date = toSafeDate(createdAt);
          if (!date) return null;
          return date.toISOString().slice(0, 10);
        })
        .filter(Boolean)
    ).size;

    const observers = uniqueObserverIds
      .map((observerId) => {
        const observerEntries = visibleSubmissions.filter((submission) => submission.userId === observerId);
        const observerInfo = userMap.get(observerId) ?? { id: observerId, name: "Observer", imageUrl: "" };

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
        detail: `${Math.max(uniqueSpecies - 2, 0)} new IDs`,
        tone: getActivityTone("Species"),
      },
      {
        label: "Community rank",
        value: `#${Math.max(8, 30 - Math.min(currentTotal, 22)).toString().padStart(2, "0")}`,
        detail: currentTotal >= 10 ? "Top 15%" : "Building momentum",
        tone: getActivityTone("Rank"),
      },
      {
        label: "Streak",
        value: `${Math.max(recentDays, 1)}d`,
        detail: recentDays > 1 ? "Active field days" : "Start your streak",
        tone: getActivityTone("Streak"),
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
        detail: `${Math.min(approvedCount, 12)} of 12 water-site reports`,
        progress: Math.min((approvedCount / 12) * 100, 100),
        icon: "💧",
      },
      {
        title: "Plant Detective",
        detail: `${Math.min(uniqueSpecies, 18)} of 18 species confirmed`,
        progress: Math.min((uniqueSpecies / 18) * 100, 100),
        icon: "🔍",
      },
    ];

    const feed = visibleSubmissions.slice(0, 3).map((submission) => {
      const observerName = submission.createdBy || (submission.userId ? "Observer" : "Community");
      const submissionName = submission.plantName || "plant report";
      const eventDate = toSafeDate(submission.createdAt ?? submission.timestamp ?? new Date()) ?? new Date();

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
  } catch (error: any) {
    console.error("Error fetching dashboard data:", error);

    const isMissingTable =
      error?.code === "PGRST205" ||
      error?.code === "42P01" ||
      error?.code === "42703" ||
      (typeof error?.message === "string" &&
        (error.message.includes("Could not find the table") ||
          error.message.includes("does not exist") ||
          error.message.includes("schema cache")));

    if (isMissingTable) {
      return NextResponse.json({
        ...fallbackDashboard,
        user: {
          id: (await auth()).userId || "local-user",
          name: (await getUserName((await auth()).userId || "local-user")) || "Observer",
        },
      });
    }

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

    const { targetUserId } = await request.json();

    if (!targetUserId || targetUserId === currentUserId) {
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
