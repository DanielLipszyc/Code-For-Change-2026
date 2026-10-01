import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  clerkClient: vi.fn(),
  supabaseFrom: vi.fn(),
  supabaseResult: { data: [] as any, error: null as any },
  maybeSingleResult: { data: null as any, error: null as any },
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
  single: vi.fn(),
  isWithinRateLimit: vi.fn(),
  toSubmission: vi.fn(),
  isValidId: vi.fn(),
  getUserRole: vi.fn(),
  isAdmin: vi.fn(),
  getPublicDisplayName: vi.fn(),
  canEditSubmission: vi.fn(),
  canDeleteSubmission: vi.fn(),
  canEditSighting: vi.fn(),
  canDeleteSighting: vi.fn(),
}));

const supabaseQuery = {
  select: (...args: unknown[]) => mocks.select(...args),
  eq: (...args: unknown[]) => mocks.eq(...args),
  order: (...args: unknown[]) => mocks.order(...args),
  limit: (...args: unknown[]) => mocks.limit(...args),
  insert: (...args: unknown[]) => mocks.insert(...args),
  update: (...args: unknown[]) => mocks.update(...args),
  delete: (...args: unknown[]) => mocks.delete(...args),
  maybeSingle: (...args: unknown[]) => mocks.maybeSingle(...args),
  single: (...args: unknown[]) => mocks.single(...args),
  then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(mocks.supabaseResult).then(resolve, reject),
};

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  clerkClient: mocks.clerkClient,
}));
vi.mock("@/lib/supabase", () => ({
  supabase: { from: mocks.supabaseFrom },
  isValidId: mocks.isValidId,
  toSubmission: mocks.toSubmission,
}));
vi.mock("@/lib/auth", () => ({
  getUserRole: mocks.getUserRole,
  isAdmin: mocks.isAdmin,
  getPublicDisplayName: mocks.getPublicDisplayName,
  canEditSubmission: mocks.canEditSubmission,
  canDeleteSubmission: mocks.canDeleteSubmission,
}));
vi.mock("@/lib/features", () => ({ PLANT_ID_ENABLED: true }));
vi.mock("@/lib/rateLimit", () => ({
  LIMITS: {
    submitSignedIn: { limit: 30, windowSeconds: 3600 },
    submitAnonymous: { limit: 10, windowSeconds: 3600 },
    identifyPlant: { limit: 30, windowSeconds: 3600 },
  },
  anonymousKey: vi.fn(() => "submit:ip:test"),
  isWithinRateLimit: mocks.isWithinRateLimit,
  tooManyRequests: (windowSeconds: number) => new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(windowSeconds) } }
  ),
}));

import { GET as getDashboard, POST as postDashboard } from "@/app/api/dashboard/route";
import { GET as getSubmissions, POST as postSubmission } from "@/app/api/submissions/route";
import {
  GET as getSubmission,
  PUT as putSubmission,
  DELETE as deleteSubmission,
} from "@/app/api/submissions/[id]/route";
import { POST as approveSubmission } from "@/app/api/submissions/[id]/approve/route";
import { GET as getUser } from "@/app/api/users/me/route";
import { POST as identifyPlant } from "@/app/api/identify-plant/route";

const validId = "123e4567-e89b-42d3-a456-426614174000";
const context = (id: string = validId) => ({ params: Promise.resolve({ id }) });
const jsonRequest = (url: string, method: string, body: unknown) =>
  new NextRequest(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

async function responseJson(response: Response) {
  return response.json();
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.auth.mockResolvedValue({ userId: null });
  mocks.clerkClient.mockResolvedValue({
    users: {
      getUser: vi.fn().mockResolvedValue({
        firstName: "Field",
        lastName: "Observer",
        emailAddresses: [{ emailAddress: "observer@example.test" }],
        publicMetadata: { role: "user" },
        imageUrl: "https://example.test/avatar.png",
      }),
    },
  });
  mocks.supabaseResult = { data: [], error: null };
  mocks.maybeSingleResult = { data: null, error: null };
  mocks.supabaseFrom.mockReturnValue(supabaseQuery);
  mocks.select.mockImplementation(() => supabaseQuery);
  mocks.eq.mockImplementation(() => supabaseQuery);
  mocks.order.mockImplementation(() => supabaseQuery);
  mocks.limit.mockImplementation(() => supabaseQuery);
  mocks.insert.mockImplementation(() => supabaseQuery);
  mocks.update.mockImplementation(() => supabaseQuery);
  mocks.delete.mockImplementation(() => supabaseQuery);
  mocks.maybeSingle.mockImplementation(() => Promise.resolve(mocks.maybeSingleResult));
  mocks.single.mockImplementation(() => Promise.resolve(mocks.supabaseResult));
  mocks.isWithinRateLimit.mockResolvedValue(true);
  mocks.toSubmission.mockImplementation((row) => ({
    _id: row.id,
    plantName: row.plant_name,
    scientificName: row.scientific_name,
    lat: row.lat,
    lng: row.lng,
    timestamp: Number(row.timestamp_ms),
    notes: row.notes,
    imageData: row.image_data,
    userId: row.user_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    status: row.status,
  }));
  mocks.isValidId.mockReturnValue(true);
  mocks.getUserRole.mockResolvedValue("user");
  mocks.isAdmin.mockResolvedValue(false);
  mocks.getPublicDisplayName.mockReturnValue("Field Observer");
  mocks.canEditSubmission.mockResolvedValue(false);
  mocks.canDeleteSubmission.mockResolvedValue(false);
  vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("dashboard API", () => {
  it("rejects an unauthenticated dashboard request", async () => {
    const response = await getDashboard(new NextRequest("http://localhost/api/dashboard"));
    expect(response.status).toBe(401);
  });

  it("returns the personalized fallback when Supabase is not configured", async () => {
    mocks.auth.mockResolvedValue({ userId: "fallback-user" });
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");

    const response = await getDashboard(new NextRequest("http://localhost/api/dashboard"));
    const payload = await responseJson(response);

    expect(response.status).toBe(200);
    expect(payload.user).toEqual({ id: "fallback-user", name: "Field Observer" });
    expect(payload.stats).toHaveLength(4);
    expect(mocks.supabaseFrom).not.toHaveBeenCalled();
  });

  it("creates and removes follow relationships", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.maybeSingleResult = { data: null, error: null };

    const created = await postDashboard(
      jsonRequest("http://localhost/api/dashboard", "POST", { targetUserId: "observer-1" })
    );
    expect(created.status).toBe(200);
    expect(await responseJson(created)).toEqual({ following: true });
    expect(mocks.insert).toHaveBeenCalledWith({ follower_id: "user-1", following_id: "observer-1" });

    mocks.maybeSingleResult = { data: { id: "follow-1" }, error: null };
    const removed = await postDashboard(
      jsonRequest("http://localhost/api/dashboard", "POST", { targetUserId: "observer-1" })
    );
    expect(removed.status).toBe(200);
    expect(await responseJson(removed)).toEqual({ following: false });
    expect(mocks.eq).toHaveBeenCalledWith("id", "follow-1");
  });

});

describe("submission APIs", () => {
  it("lists submissions in timestamp order", async () => {
    mocks.supabaseResult = {
      data: [{ id: "row-1", plant_name: "Air Potato", status: "approved", user_id: "owner-1" }],
      error: null,
    };
    const response = await getSubmissions();
    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual([{
      _id: "row-1",
      plantName: "Air Potato",
      timestamp: null,
      userId: null,
      status: "approved",
    }]);
    expect(mocks.order).toHaveBeenCalledWith("timestamp_ms", { ascending: false });
  });

  it("requires auth except for explicitly anonymous submissions", async () => {
    const denied = await postSubmission(
      jsonRequest("http://localhost/api/submissions", "POST", { plantName: "Air Potato" })
    );
    expect(denied.status).toBe(401);

    const invalid = await postSubmission(
      jsonRequest("http://localhost/api/submissions", "POST", { anonymous: true, plantName: "" })
    );
    expect(invalid.status).toBe(400);
  });

  it("rate-limits anonymous submissions", async () => {
    mocks.isWithinRateLimit.mockResolvedValue(false);
    const response = await postSubmission(
      jsonRequest("http://localhost/api/submissions", "POST", { anonymous: true })
    );
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3600");
  });

  it("creates anonymous reports with pending moderation", async () => {
    mocks.supabaseResult = { data: { id: "created-1" }, error: null };
    const response = await postSubmission(
      jsonRequest("http://localhost/api/submissions", "POST", {
        anonymous: true,
        plantName: "Air Potato",
        lat: 29.65,
        lng: -82.32,
      })
    );
    const body = await responseJson(response);
    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      plant_name: "Air Potato",
      created_by: "Anonymous",
      status: "pending",
    }));
  });

  it("returns 404 for an unknown submission", async () => {
    const response = await getSubmission(new NextRequest(`http://localhost/api/submissions/${validId}`), context());
    expect(response.status).toBe(404);
  });

  it("returns a found submission by ID", async () => {
    mocks.maybeSingleResult = {
      data: { id: validId, plant_name: "Air Potato", status: "approved", user_id: "owner-1" },
      error: null,
    };
    const response = await getSubmission(
      new NextRequest(`http://localhost/api/submissions/${validId}`),
      context()
    );
    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({ plantName: "Air Potato" });
  });

  it("updates only an owned submission and rejects non-owners", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    const denied = await putSubmission(
      jsonRequest(`http://localhost/api/submissions/${validId}`, "PUT", { plantName: "Wild Taro" }),
      context()
    );
    expect(denied.status).toBe(403);

    mocks.canEditSubmission.mockResolvedValue(true);
    mocks.supabaseResult = { data: [{ id: validId }], error: null };
    const response = await putSubmission(
      jsonRequest(`http://localhost/api/submissions/${validId}`, "PUT", { notes: "New field note" }),
      context()
    );
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ notes: "New field note" }));
  });

  it("requires admin permission to approve submissions", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    expect((await approveSubmission(new NextRequest(`http://localhost/api/submissions/${validId}/approve`, { method: "POST" }), context())).status).toBe(403);

    mocks.isAdmin.mockResolvedValue(true);
    mocks.supabaseResult = { data: [{ id: validId }], error: null };
    const response = await approveSubmission(
      new NextRequest(`http://localhost/api/submissions/${validId}/approve`, { method: "POST" }),
      context()
    );
    expect(response.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ status: "approved", approved_by: "user-1" }));
  });

  it("deletes a submission only when the permission helper allows it", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    const denied = await deleteSubmission(
      new NextRequest(`http://localhost/api/submissions/${validId}`, { method: "DELETE" }),
      context()
    );
    expect(denied.status).toBe(403);

    mocks.canDeleteSubmission.mockResolvedValue(true);
    mocks.supabaseResult = { data: [{ id: validId }], error: null };
    const response = await deleteSubmission(
      new NextRequest(`http://localhost/api/submissions/${validId}`, { method: "DELETE" }),
      context()
    );
    expect(response.status).toBe(200);
    expect(mocks.delete).toHaveBeenCalled();
  });
});

describe("user and plant-identification APIs", () => {
  it("returns the current user's profile and role", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.getUserRole.mockResolvedValue("admin");
    const response = await getUser();
    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      id: "user-1",
      email: "observer@example.test",
      role: "admin",
    });
  });

  it("rejects requests for a user profile without authentication", async () => {
    expect((await getUser()).status).toBe(401);
  });

  it("validates image input and reports missing API configuration", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    const noImage = await identifyPlant(jsonRequest("http://localhost/api/identify-plant", "POST", {}));
    expect(noImage.status).toBe(400);

    vi.stubEnv("GEMINI_API_KEY", "");
    const noKey = await identifyPlant(
      jsonRequest("http://localhost/api/identify-plant", "POST", { image: "data:image/png;base64,AAAA" })
    );
    expect(noKey.status).toBe(500);
  });

  it("normalizes a known model prediction to catalog data", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({
      candidates: [{ content: { parts: [{ text: "Air Potato" }] } }],
    }), { status: 200, headers: { "Content-Type": "application/json" } })));

    const response = await identifyPlant(
      jsonRequest("http://localhost/api/identify-plant", "POST", { image: "data:image/png;base64,AAAA" })
    );
    expect(response.status).toBe(200);
    expect(await responseJson(response)).toMatchObject({
      prediction: "Air Potato",
      scientificName: "Dioscorea bulbifera",
      isKnownPlant: true,
    });
  });

  it("returns a controlled error when the model request fails", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
    const response = await identifyPlant(
      jsonRequest("http://localhost/api/identify-plant", "POST", { image: "data:image/png;base64,AAAA" })
    );
    expect(response.status).toBe(500);
    expect(await responseJson(response)).toEqual({ error: "Failed to analyze image" });
  });
});