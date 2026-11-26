import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A stand-in for the Supabase client: each query resolves to the rows set up
 * for its select() columns in `state.rows`.
 */
const state = vi.hoisted(() => ({
  rows: {} as Record<string, unknown[]>,
  getUserList: vi.fn(),
  followedRows: [] as unknown[],
  filters: [] as [string, unknown[]][],
  followedFilters: [] as [string, unknown[]][],
  catalog: [] as { scientificName: string }[],
}));

vi.mock("./db", () => ({
  supabase: {
    from: () => {
      let columns = "";
      let followed = false;
      let start = 0;
      let end: number | undefined;
      const filters: [string, unknown[]][] = [];
      const builder: Record<string, unknown> = {
        select: (selected: string) => {
          columns = selected;
          return builder;
        },
        then: (resolve: (value: unknown) => void) => {
          if (followed) state.followedFilters.push(...filters);
          resolve({
            data: (followed ? state.followedRows : (state.rows[columns] ?? [])).slice(start, end),
            error: null,
          });
        },
      };
      builder.range = (from: number, to: number) => {
        start = from;
        end = to + 1;
        filters.push(["range", [from, to]]);
        state.filters.push(["range", [from, to]]);
        return builder;
      };
      for (const method of ["eq", "not", "or", "order", "limit", "in"]) {
        builder[method] = (...args: unknown[]) => {
          state.filters.push([method, args]);
          filters.push([method, args]);
          if (method === "in") followed = true;
          return builder;
        };
      }
      return builder;
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUserList: state.getUserList } }),
}));
vi.mock("./plants", () => ({ getPlants: async () => state.catalog }));

import { plants } from "@/data/plants";
import { getDashboard, listCommunityFeed } from "./dashboard";

const ME = "user_me";
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const MINE = "scientific_name, status, created_at";
const APPROVED = "user_id";
const RECENT = "user_id, plant_name, created_by, created_at, status";
const FEED = "id, user_id, plant_name, created_by, created_at, status";
const FOLLOWS = "following_id";

beforeEach(() => {
  state.filters = [];
  state.followedFilters = [];
  state.followedRows = [];
  state.catalog = plants;
  state.rows = {
    [MINE]: [
      { scientific_name: "Dioscorea bulbifera", status: "approved", created_at: daysAgo(1) },
      { scientific_name: "Dioscorea bulbifera", status: "pending", created_at: daysAgo(3) },
      // "Unknown Plant" has no scientific name and isn't a species
      { scientific_name: null, status: "approved", created_at: daysAgo(10) },
    ],
    [APPROVED]: [
      { user_id: ME },
      { user_id: ME },
      { user_id: "user_ana" },
      { user_id: "user_ana" },
      { user_id: "user_ana" },
      { user_id: "user_bo" },
    ],
    [RECENT]: [
      {
        id: "bo",
        user_id: "user_bo",
        plant_name: "Air Potato",
        created_by: "Bo",
        created_at: daysAgo(0),
        status: "approved",
      },
      {
        id: "me",
        user_id: ME,
        plant_name: "Air Potato",
        created_by: "Me",
        created_at: daysAgo(1),
        status: "approved",
      },
      {
        id: "ana1",
        user_id: "user_ana",
        plant_name: "Cogon Grass",
        created_by: "Ana",
        created_at: daysAgo(2),
        status: "approved",
      },
      {
        id: "ana2",
        user_id: "user_ana",
        plant_name: "Wild Taro",
        created_by: "Ana",
        created_at: daysAgo(4),
        status: "approved",
      },
    ],
    [FOLLOWS]: [{ following_id: "user_bo" }],
  };
  state.rows[FEED] = state.rows[RECENT];
  state.getUserList.mockReset().mockResolvedValue({
    data: [
      { id: ME, firstName: "Me", lastName: "Self", username: null, imageUrl: "me.png" },
      { id: "user_ana", firstName: "Ana", lastName: "Lopez", username: null, imageUrl: "ana.png" },
      // user_bo isn't returned, so they show as "Observer"
    ],
  });
});

const stat = (data: Awaited<ReturnType<typeof getDashboard>>, label: string) =>
  data.stats.find((s) => s.label === label);

describe("getDashboard", () => {
  it("counts the user's own reports", async () => {
    const data = await getDashboard(ME);
    expect(stat(data, "Observations")).toMatchObject({ value: "3", detail: "2 approved" });
    expect(stat(data, "Species logged")).toMatchObject({
      value: "1",
      detail: `of ${plants.length} tracked species`,
    });
    expect(stat(data, "Field days")).toMatchObject({ value: "3" });
    expect(data.summary).toEqual({ reportsThisWeek: 2, pendingReview: 1 });
  });

  it("ranks the user by approved reports among all observers", async () => {
    // Ana has 3 approved, the user 2, Bo 1
    expect(stat(await getDashboard(ME), "Community rank")).toMatchObject({
      value: "#2",
      detail: "of 3 observers",
    });
  });

  it("doesn't rank a user with no approved reports", async () => {
    state.rows[MINE] = [{ scientific_name: null, status: "pending", created_at: daysAgo(1) }];
    expect(stat(await getDashboard(ME), "Community rank")).toMatchObject({ value: "—" });
  });

  it("lists recent observers, most approved reports first, with their latest plant", async () => {
    const { observers } = await getDashboard(ME);
    expect(observers).toEqual([
      expect.objectContaining({ id: "user_bo", name: "Observer", sightings: 1, following: true }),
      expect.objectContaining({
        id: "user_ana",
        name: "Ana Lopez",
        focus: "Cogon Grass",
        sightings: 3,
        following: false,
        avatar: "AN",
      }),
    ]);
  });

  it("looks up every display name in one Clerk call", async () => {
    const data = await getDashboard(ME);
    expect(state.getUserList).toHaveBeenCalledTimes(1);
    expect(state.getUserList).toHaveBeenCalledWith({
      userId: [ME, "user_bo", "user_ana"],
      limit: 3,
    });
    expect(data.user).toEqual({ id: ME, name: "Me Self" });
  });

  it("still loads when Clerk can't be reached", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    state.getUserList.mockRejectedValue(new Error("Clerk unavailable"));
    const data = await getDashboard(ME);
    expect(data.user.name).toBe("Observer");
    expect(data.observers.map((o) => o.name)).toEqual(["Observer", "Observer"]);
  });

  it("builds the feed from the newest reports", async () => {
    const { feed } = await getDashboard(ME);
    expect(feed.map((item) => [item.author, item.plant, item.type])).toEqual([
      ["Bo", "Air Potato", "species"],
      ["Me", "Air Potato", "connection"],
      ["Ana", "Cogon Grass", "species"],
      ["Ana", "Wild Taro", "species"],
    ]);
  });

  it("keeps followed observers outside the recent window and queries their approved reports", async () => {
    state.rows[FOLLOWS] = [{ following_id: "user_old" }];
    state.followedRows = [
      {
        id: "old",
        user_id: "user_old",
        plant_name: "Air Potato",
        created_by: "Old",
        created_at: daysAgo(20),
        status: "approved",
      },
    ];
    const data = await getDashboard(ME);
    expect(data.observers[0]).toMatchObject({ id: "user_old", following: true });
    expect(data.followingFeed).toMatchObject([{ author: "Old", plant: "Air Potato" }]);
    expect(state.followedFilters).toContainEqual(["in", ["user_id", ["user_old"]]]);
    expect(state.followedFilters).toContainEqual(["eq", ["status", "approved"]]);
  });

  it("includes approved observers outside the recent reports and beyond the first database page", async () => {
    state.rows[APPROVED] = [
      ...Array.from({ length: 1000 }, () => ({ user_id: "user_bo" })),
      { user_id: "user_old" },
    ];
    const data = await getDashboard(ME);
    expect(data.observers).toContainEqual(
      expect.objectContaining({ id: "user_old", sightings: 1, following: false }),
    );
    expect(state.filters).toContainEqual(["range", [1000, 1999]]);
  });

  it("pages all visible community reports with a stable order and no truncation at 50", async () => {
    state.rows[FEED] = Array.from({ length: 55 }, (_, i) => ({
      id: `report_${i}`,
      user_id: "user_bo",
      plant_name: `Plant ${i}`,
      created_by: "Bo",
      created_at: daysAgo(i),
      status: "approved",
    }));
    const pages = await Promise.all([0, 20, 40].map((offset) => listCommunityFeed(ME, offset)));
    expect(pages.map((page) => page.feed.length)).toEqual([20, 20, 15]);
    expect(pages.map((page) => page.hasMoreFeed)).toEqual([true, true, false]);
    expect(new Set(pages.flatMap((page) => page.feed.map((item) => item.id))).size).toBe(55);
    expect(state.filters).toContainEqual(["or", [`status.eq.approved,user_id.eq.${ME}`]]);
    expect(state.filters).toContainEqual(["order", ["id", { ascending: false }]]);
    expect(state.filters).toContainEqual(["range", [40, 60]]);
  });

  it("does not interpolate an unsafe user ID into the community filter", async () => {
    await listCommunityFeed("user_me,status.eq.pending");
    expect(state.filters).toContainEqual(["or", ["status.eq.approved"]]);
  });

  it("does not query a following feed when no observers are followed", async () => {
    state.rows[FOLLOWS] = [];
    expect((await getDashboard(ME)).followingFeed).toEqual([]);
    expect(state.filters.filter(([method]) => method === "in")).toEqual([]);
  });

  it("only counts species in the active catalog", async () => {
    state.catalog = [{ scientificName: "Dioscorea bulbifera" }];
    state.rows[MINE].push({
      scientific_name: "Not in the catalog",
      status: "approved",
      created_at: daysAgo(0),
    });
    expect(stat(await getDashboard(ME), "Species logged")).toMatchObject({
      value: "1",
      detail: "of 1 tracked species",
    });
  });
});
