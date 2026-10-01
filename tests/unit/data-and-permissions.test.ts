import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { plants, plantNames } from "@/data/plants";
import { translations } from "@/lib/translation";
import {
  addSubmission,
  clearSubmissions,
  getSubmissions,
  SUBMISSIONS_KEY,
} from "@/types/submissions";
import {
  canDeleteSighting,
  canDeleteSubmission,
  canEditSighting,
  canEditSubmission,
  getUserRole,
  isAdmin,
} from "@/lib/auth";

const mocks = vi.hoisted(() => ({
  clerkClient: vi.fn(),
  supabaseFrom: vi.fn(),
  queryResult: { data: null as any, error: null as any },
}));

vi.mock("@clerk/nextjs/server", () => ({ clerkClient: mocks.clerkClient }));
vi.mock("@/lib/supabase", () => ({
  supabase: { from: mocks.supabaseFrom },
  isValidId: vi.fn((id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)),
}));

const supabaseQuery = {
  select: vi.fn(() => supabaseQuery),
  eq: vi.fn(() => supabaseQuery),
  maybeSingle: vi.fn(() => Promise.resolve(mocks.queryResult)),
};

function createStorage() {
  const data = new Map<string, string>();
  return {
    getItem: vi.fn((key: string) => data.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => data.set(key, value)),
    removeItem: vi.fn((key: string) => data.delete(key)),
  };
}

describe("plant data and translations", () => {
  it("keeps a unique plant-name index in catalog order", () => {
    expect(plantNames).toHaveLength(plants.length);
    expect(new Set(plantNames).size).toBe(plants.length);
    expect(plantNames[0]).toBe("Air Potato");
  });

  it("provides navigation and guide copy in both supported languages", () => {
    expect(translations.en.nav.home).toBe("Home");
    expect(translations.es.nav.home).toBe("Inicio");
    expect(translations.en.guide.reportButton).toBeTruthy();
    expect(translations.es.guide.reportButton).toBeTruthy();
  });
});

describe("local submission storage", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("returns no submissions during server rendering", () => {
    vi.stubGlobal("window", undefined);
    expect(getSubmissions()).toEqual([]);
  });

  it("adds, reads, and clears submissions from local storage", () => {
    const storage = createStorage();
    vi.stubGlobal("window", {});
    vi.stubGlobal("localStorage", storage);
    const submission = {
      id: "submission-1",
      plantName: "Air Potato",
      lat: 29.65,
      lng: -82.32,
      timestamp: 1_700_000_000_000,
    };

    addSubmission(submission);
    expect(storage.setItem).toHaveBeenCalledWith(SUBMISSIONS_KEY, JSON.stringify([submission]));
    expect(getSubmissions()).toEqual([submission]);

    clearSubmissions();
    expect(storage.removeItem).toHaveBeenCalledWith(SUBMISSIONS_KEY);
  });
});

describe("authorization helpers", () => {
  beforeEach(() => {
    mocks.clerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({ publicMetadata: { role: "admin" } }),
      },
    });
    mocks.queryResult = { data: { user_id: "user-1" }, error: null };
    mocks.supabaseFrom.mockReturnValue(supabaseQuery);
  });

  it("defaults to the user role when Clerk has no role metadata", async () => {
    mocks.clerkClient.mockResolvedValueOnce({
      users: { getUser: vi.fn().mockResolvedValue({ publicMetadata: {} }) },
    });
    await expect(getUserRole("user-1")).resolves.toBe("user");
  });

  it("recognizes admins and grants their delete override", async () => {
    await expect(isAdmin("admin-1")).resolves.toBe(true);
    await expect(canDeleteSubmission("admin-1", "submission-1")).resolves.toBe(true);
    await expect(canDeleteSighting("admin-1", "sighting-1")).resolves.toBe(true);
    expect(mocks.supabaseFrom).not.toHaveBeenCalled();
  });

  it("allows edits only for the record owner", async () => {
    const validId = "123e4567-e89b-42d3-a456-426614174000";
    await expect(canEditSubmission("user-1", validId)).resolves.toBe(true);
    await expect(canEditSighting("other-user", validId)).resolves.toBe(false);
  });

  it("denies edits for blank, missing, or legacy records", async () => {
    await expect(canEditSubmission("user-1", " ")).resolves.toBe(false);
    mocks.queryResult = { data: null, error: null };
    const validId = "123e4567-e89b-42d3-a456-426614174000";
    await expect(canEditSighting("user-1", validId)).resolves.toBe(false);
    mocks.queryResult = { data: { user_id: null }, error: null };
    await expect(canEditSubmission("user-1", validId)).resolves.toBe(false);
  });

  it("denies deleting a legacy record for a non-admin", async () => {
    mocks.clerkClient.mockResolvedValue({
      users: { getUser: vi.fn().mockResolvedValue({ publicMetadata: {} }) },
    });
    mocks.queryResult = { data: { user_id: null }, error: null };
    await expect(canDeleteSighting("user-1", "123e4567-e89b-42d3-a456-426614174000")).resolves.toBe(false);
  });
});