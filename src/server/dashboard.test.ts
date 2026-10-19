import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A stand-in for the Supabase client: each query resolves to the rows set up
 * for its select() columns in `state.rows`.
 */
const state = vi.hoisted(() => ({
  rows: {} as Record<string, unknown[]>,
  getUserList: vi.fn(),
}));

vi.mock("./db", () => ({
  supabase: {
    from: () => {
      let columns = "";
      const builder: Record<string, unknown> = {
        select: (selected: string) => {
          columns = selected;
          return builder;
        },
        then: (resolve: (value: unknown) => void) =>
          resolve({ data: state.rows[columns] ?? [], error: null }),
      };
      for (const method of ["eq", "not", "or", "order", "limit"]) {
        builder[method] = () => builder;
      }
      return builder;
    },
  },
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUserList: state.getUserList } }),
}));

import { plants } from "@/data/plants";
import { getDashboard } from "./dashboard";

const ME = "user_me";
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

const MINE = "scientific_name, status, created_at";
const APPROVED = "user_id";
const RECENT = "user_id, plant_name, created_by, created_at, status";
const FOLLOWS = "following_id";

beforeEach(() => {
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
        user_id: "user_bo",
        plant_name: "Air Potato",
        created_by: "Bo",
        created_at: daysAgo(0),
        status: "approved",
      },
      {
        user_id: ME,
        plant_name: "Air Potato",
        created_by: "Me",
        created_at: daysAgo(1),
        status: "approved",
      },
      {
        user_id: "user_ana",
        plant_name: "Cogon Grass",
        created_by: "Ana",
        created_at: daysAgo(2),
        status: "approved",
      },
      {
        user_id: "user_ana",
        plant_name: "Wild Taro",
        created_by: "Ana",
        created_at: daysAgo(4),
        status: "approved",
      },
    ],
    [FOLLOWS]: [{ following_id: "user_bo" }],
  };
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
      expect.objectContaining({
        id: "user_ana",
        name: "Ana Lopez",
        focus: "Cogon Grass",
        sightings: 3,
        following: false,
        avatar: "AN",
      }),
      expect.objectContaining({ id: "user_bo", name: "Observer", sightings: 1, following: true }),
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
    expect(feed.map((item) => [item.title, item.type])).toEqual([
      ["Bo logged Air Potato", "species"],
      ["Me logged Air Potato", "connection"],
      ["Ana logged Cogon Grass", "species"],
    ]);
  });
});
