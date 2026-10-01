import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { plants } from "@/data/plants";
import { CLERK_USER_ID } from "@/lib/schemas";
import type { Achievement, DashboardData, Observer, Stat } from "@/types/dashboard";
import type { SubmissionStatus } from "@/types/submission";
import { getPublicDisplayName } from "./authz";
import { supabase } from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How many recent reports to scan for the feed and the observer list */
const RECENT_LIMIT = 50;

/**
 * Display names and avatars for a set of users, in one Clerk call.
 * Users Clerk can't return show as "Observer".
 */
async function getProfiles(userIds: string[]) {
  const profiles = new Map<string, { name: string; imageUrl: string }>();
  if (userIds.length === 0) return profiles;

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      userId: userIds,
      limit: userIds.length,
    });
    for (const user of users) {
      profiles.set(user.id, {
        name: getPublicDisplayName(user, { includeLastName: true }),
        imageUrl: user.imageUrl,
      });
    }
  } catch (error) {
    console.error("Error fetching observer profiles:", error);
  }
  return profiles;
}

/**
 * Everything the dashboard shows for one user. Reads only the columns it
 * needs (never photos) and makes one Clerk call for all display names.
 */
export async function getDashboard(userId: string): Promise<DashboardData> {
  // Clerk IDs are [A-Za-z0-9_]; anything else must not reach the filter string
  const visibleFilter = CLERK_USER_ID.test(userId)
    ? `status.eq.approved,user_id.eq.${userId}`
    : "status.eq.approved";

  const [mineResult, approvedResult, recentResult, followsResult] = await Promise.all([
    supabase
      .from("submissions")
      .select("scientific_name, status, created_at")
      .eq("user_id", userId),
    // Approved reports per observer, for the rank and observer sighting counts
    supabase
      .from("submissions")
      .select("user_id")
      .eq("status", "approved")
      .not("user_id", "is", null),
    // Recent reports for the feed and observer list. Other people's pending
    // reports haven't been reviewed, so they're left out.
    supabase
      .from("submissions")
      .select("user_id, plant_name, created_by, created_at, status")
      .or(visibleFilter)
      .order("created_at", { ascending: false })
      .limit(RECENT_LIMIT),
    supabase.from("follows").select("following_id").eq("follower_id", userId),
  ]);

  for (const result of [mineResult, approvedResult, recentResult, followsResult]) {
    if (result.error) throw result.error;
  }

  const mine = mineResult.data as {
    scientific_name: string | null;
    status: SubmissionStatus;
    created_at: string;
  }[];
  const recent = recentResult.data as {
    user_id: string | null;
    plant_name: string;
    created_by: string | null;
    created_at: string;
    status: SubmissionStatus;
  }[];
  const followingIds = new Set(
    (followsResult.data as { following_id: string }[]).map((row) => row.following_id),
  );

  // The signed-in user's own numbers
  const total = mine.length;
  const approvedCount = mine.filter((s) => s.status === "approved").length;
  // Listed species only: "Unknown Plant" has no scientific name
  const uniqueSpecies = new Set(mine.map((s) => s.scientific_name).filter(Boolean)).size;
  const fieldDays = new Set(mine.map((s) => s.created_at.slice(0, 10))).size;
  const weekAgo = Date.now() - 7 * DAY_MS;
  const reportsThisWeek = mine.filter((s) => Date.parse(s.created_at) >= weekAgo).length;

  // Rank by approved reports: 1 + the number of observers with more than you
  const approvedByObserver = new Map<string, number>();
  for (const { user_id } of approvedResult.data as { user_id: string }[]) {
    approvedByObserver.set(user_id, (approvedByObserver.get(user_id) ?? 0) + 1);
  }
  const rank =
    1 + Array.from(approvedByObserver.values()).filter((count) => count > approvedCount).length;

  // Up to 8 recently active observers, then the 4 with the most approved reports
  const recentObserverIds: string[] = [];
  const latestPlant = new Map<string, string>();
  for (const report of recent) {
    if (!report.user_id || report.user_id === userId || latestPlant.has(report.user_id)) continue;
    latestPlant.set(report.user_id, report.plant_name);
    recentObserverIds.push(report.user_id);
    if (recentObserverIds.length === 8) break;
  }

  const profiles = await getProfiles([userId, ...recentObserverIds]);

  const observers: Observer[] = recentObserverIds
    .map((id) => {
      const name = profiles.get(id)?.name ?? "Observer";
      return {
        id,
        name,
        focus: latestPlant.get(id) || "Field tracking",
        sightings: approvedByObserver.get(id) ?? 0,
        following: followingIds.has(id),
        avatar: name.slice(0, 2).toUpperCase(),
        imageUrl: profiles.get(id)?.imageUrl ?? "",
      };
    })
    .sort((a, b) => b.sightings - a.sightings)
    .slice(0, 4);

  const stats: Stat[] = [
    {
      label: "Observations",
      value: total.toString(),
      detail: `${approvedCount} approved`,
      tone: "emerald",
    },
    {
      label: "Species logged",
      value: uniqueSpecies.toString(),
      detail: `of ${plants.length} tracked species`,
      tone: "sky",
    },
    {
      label: "Community rank",
      value: approvedCount > 0 ? `#${rank}` : "—",
      detail:
        approvedCount > 0
          ? `of ${approvedByObserver.size} observers`
          : "Get a report approved to rank",
      tone: "orange",
    },
    {
      label: "Field days",
      value: fieldDays.toString(),
      detail: "Days with a report",
      tone: "violet",
    },
  ];

  const achievements: Achievement[] = [
    {
      title: "Trail Recon",
      detail: `${Math.min(total, 5)} of 5 field checks logged`,
      progress: Math.min((total / 5) * 100, 100),
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

  const feed = recent.slice(0, 3).map((report) => ({
    title: `${report.created_by || (report.user_id ? "Observer" : "Community")} logged ${report.plant_name}`,
    meta: `${new Date(report.created_at).toLocaleDateString("en-US")} · ${report.status}`,
    type: report.user_id === userId ? ("connection" as const) : ("species" as const),
  }));

  return {
    user: { id: userId, name: profiles.get(userId)?.name ?? "Observer" },
    stats,
    summary: { reportsThisWeek, pendingReview: total - approvedCount },
    observers,
    achievements,
    feed,
  };
}

/** Follow an observer, or unfollow if already following. Returns the new state. */
export async function toggleFollow(followerId: string, targetId: string): Promise<boolean> {
  const { data: existing, error: lookupError } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", followerId)
    .eq("following_id", targetId)
    .maybeSingle();
  if (lookupError) throw lookupError;

  if (existing) {
    const { error } = await supabase.from("follows").delete().eq("id", existing.id);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: followerId, following_id: targetId });
  if (error) throw error;
  return true;
}
