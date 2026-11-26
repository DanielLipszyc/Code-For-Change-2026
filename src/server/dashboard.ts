import "server-only";
import { clerkClient } from "@clerk/nextjs/server";
import { CLERK_USER_ID } from "@/lib/schemas";
import type { Achievement, DashboardData, FeedItem, Observer, Stat } from "@/types/dashboard";
import type { SubmissionStatus } from "@/types/submission";
import { getPublicDisplayName } from "./authz";
import { supabase } from "./db";
import { getPlants } from "./plants";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How many recent reports to scan for observers' latest plants */
const RECENT_LIMIT = 50;
const FEED_PAGE_SIZE = 20;
const QUERY_PAGE_SIZE = 1000;

interface FeedRow {
  id: string;
  user_id: string | null;
  plant_name: string;
  created_by: string | null;
  created_at: string;
  status: SubmissionStatus;
}

function visibleFilter(userId: string): string {
  return CLERK_USER_ID.test(userId)
    ? `status.eq.approved,user_id.eq.${userId}`
    : "status.eq.approved";
}

function toFeedItem(report: FeedRow, userId: string): FeedItem {
  return {
    id: report.id,
    author: report.created_by || (report.user_id ? "Observer" : "Community"),
    plant: report.plant_name,
    createdAt: report.created_at,
    status: report.status,
    type: report.user_id === userId ? "connection" : "species",
  };
}

/** Approved community reports and the viewer's own, newest first. */
export async function listCommunityFeed(userId: string, offset = 0) {
  const { data, error } = await supabase
    .from("submissions")
    .select("id, user_id, plant_name, created_by, created_at, status")
    .or(visibleFilter(userId))
    .order("created_at", { ascending: false })
    .order("id", { ascending: false })
    .range(offset, offset + FEED_PAGE_SIZE);
  if (error) throw error;
  const rows = data as FeedRow[];
  return {
    feed: rows.slice(0, FEED_PAGE_SIZE).map((report) => toFeedItem(report, userId)),
    hasMoreFeed: rows.length > FEED_PAGE_SIZE,
  };
}

async function getApprovedObserverCounts() {
  const counts = new Map<string, number>();
  for (let offset = 0; ; offset += QUERY_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("submissions")
      .select("user_id")
      .eq("status", "approved")
      .not("user_id", "is", null)
      .order("id")
      .range(offset, offset + QUERY_PAGE_SIZE - 1);
    if (error) throw error;
    const rows = data as { user_id: string }[];
    for (const { user_id } of rows) counts.set(user_id, (counts.get(user_id) ?? 0) + 1);
    if (rows.length < QUERY_PAGE_SIZE) return counts;
  }
}

/**
 * Display names and avatars for a set of users, in batches.
 * Users Clerk can't return show as "Observer".
 */
async function getProfiles(userIds: string[]) {
  const profiles = new Map<string, { name: string; imageUrl: string }>();
  if (userIds.length === 0) return profiles;

  try {
    const client = await clerkClient();
    for (let offset = 0; offset < userIds.length; offset += 100) {
      const batch = userIds.slice(offset, offset + 100);
      const { data: users } = await client.users.getUserList({
        userId: batch,
        limit: batch.length,
      });
      for (const user of users) {
        profiles.set(user.id, {
          name: getPublicDisplayName(user, { includeLastName: true }),
          imageUrl: user.imageUrl,
        });
      }
    }
  } catch (error) {
    console.error("Error fetching observer profiles:", error);
  }
  return profiles;
}

/**
 * Everything the dashboard shows for one user. Reads only the columns it
 * needs (never photos) and batches Clerk display-name lookups.
 */
export async function getDashboard(userId: string): Promise<DashboardData> {
  const [mineResult, approvedByObserver, recentResult, followsResult, plants, community] =
    await Promise.all([
      supabase
        .from("submissions")
        .select("scientific_name, status, created_at")
        .eq("user_id", userId),
      getApprovedObserverCounts(),
      // Recent reports for observer details. Other people's pending
      // reports haven't been reviewed, so they're left out.
      supabase
        .from("submissions")
        .select("user_id, plant_name, created_by, created_at, status")
        .or(visibleFilter(userId))
        .order("created_at", { ascending: false })
        .limit(RECENT_LIMIT),
      supabase.from("follows").select("following_id").eq("follower_id", userId),
      getPlants(),
      listCommunityFeed(userId),
    ]);

  for (const result of [mineResult, recentResult, followsResult]) {
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
  const trackedSpecies = new Set(plants.map((plant) => plant.scientificName.toLowerCase()));
  const uniqueSpecies = new Set(
    mine.flatMap((s) => {
      const name = s.scientific_name?.toLowerCase();
      return name && trackedSpecies.has(name) ? [name] : [];
    }),
  ).size;
  const fieldDays = new Set(mine.map((s) => s.created_at.slice(0, 10))).size;
  const weekAgo = Date.now() - 7 * DAY_MS;
  const reportsThisWeek = mine.filter((s) => Date.parse(s.created_at) >= weekAgo).length;

  // Rank by approved reports: 1 + the number of observers with more than you
  const rank =
    1 + Array.from(approvedByObserver.values()).filter((count) => count > approvedCount).length;

  // Keep followed observers accessible even after they leave the recent activity window.
  const recentObserverIds: string[] = [];
  const latestPlant = new Map<string, string>();
  for (const report of recent) {
    if (!report.user_id || report.user_id === userId || latestPlant.has(report.user_id)) continue;
    latestPlant.set(report.user_id, report.plant_name);
    recentObserverIds.push(report.user_id);
  }

  const observerIds = [
    ...new Set([...followingIds, ...recentObserverIds, ...approvedByObserver.keys()]),
  ].filter((id) => id !== userId);
  const profiles = await getProfiles([userId, ...observerIds]);

  const observers: Observer[] = observerIds
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
    .sort((a, b) => Number(b.following) - Number(a.following) || b.sightings - a.sightings);

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
      progress: plants.length ? (uniqueSpecies / plants.length) * 100 : 0,
      icon: "🔍",
    },
  ];

  const followedReports = await Promise.all(
    Array.from({ length: Math.ceil(followingIds.size / 50) }, (_, index) =>
      supabase
        .from("submissions")
        .select("id, user_id, plant_name, created_by, created_at, status")
        .eq("status", "approved")
        .in("user_id", [...followingIds].slice(index * 50, (index + 1) * 50))
        .order("created_at", { ascending: false })
        .limit(3),
    ),
  );
  for (const result of followedReports) {
    if (result.error) throw result.error;
  }
  const followingFeed = followedReports
    .flatMap((result) => result.data as FeedRow[])
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, 3)
    .map((report) => toFeedItem(report, userId));

  return {
    user: { id: userId, name: profiles.get(userId)?.name ?? "Observer" },
    stats,
    summary: { reportsThisWeek, pendingReview: total - approvedCount },
    observers,
    achievements,
    ...community,
    followingFeed,
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
