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
  toSubmission: vi.fn(),
  toSighting: vi.fn(),
  isValidId: vi.fn(),
  getUserRole: vi.fn(),
  isAdmin: vi.fn(),
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
  toSighting: mocks.toSighting,
}));
vi.mock("@/lib/auth", () => ({
  getUserRole: mocks.getUserRole,
  isAdmin: mocks.isAdmin,
  canEditSubmission: mocks.canEditSubmission,
  canDeleteSubmission: mocks.canDeleteSubmission,
  canEditSighting: mocks.canEditSighting,
  canDeleteSighting: mocks.canDeleteSighting,
}));

import { GET as getDashboard, POST as postDashboard } from "@/app/api/dashboard/route";
import { GET as getSubmissions, POST as postSubmission } from "@/app/api/submissions/route";
import {
  GET as getSubmission,
  PUT as putSubmission,
  DELETE as deleteSubmission,
} from "@/app/api/submissions/[id]/route";
import { POST as approveSubmission } from "@/app/api/submissions/[id]/approve/route";
import { GET as getSightings, POST as postSighting } from "@/app/api/sightings/route";
import {
  GET as getSighting,
  PUT as putSighting,
  DELETE as deleteSighting,
} from "@/app/api/sightings/[id]/route";
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
  mocks.toSighting.mockImplementation((row) => ({
    _id: row.id,
    speciesId: row.species_id,
    lat: row.lat,
    lng: row.lng,
    locationAccuracyM: row.location_accuracy_m,
    addressApprox: row.address_approx,
    observedAt: row.observed_at,
    reportedAt: row.reported_at,
    notes: row.notes,
    status: row.status,
    userId: row.user_id,
    createdBy: row.created_by,
    updatedAt: row.updated_at,
  }));
  mocks.isValidId.mockReturnValue(true);
  mocks.getUserRole.mockResolvedValue("user");
  mocks.isAdmin.mockResolvedValue(false);
  mocks.canEditSubmission.mockResolvedValue(false);
  mocks.canDeleteSubmission.mockResolvedValue(false);
  mocks.canEditSighting.mockResolvedValue(false);
  mocks.canDeleteSighting.mockResolvedValue(false);
  vi.stubEnv("GEMINI_API_KEY", "test-gemini-key");
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "log").mockImplementation(() => {});
});

describe("dashboard API", () => {
  it("returns the isolated demo dashboard payload", async () => {
    const response = await getDashboard(new NextRequest("http://localhost/api/dashboard?demo=1"));
    const body = await responseJson(response);

    expect(response.status).toBe(200);
    expect(body.user.id).toBe("demo-user");
    expect(body.stats).toHaveLength(4);
    expect(body.observers.length).toBeGreaterThan(0);
    expect(mocks.supabaseFrom).not.toHaveBeenCalled();
  });

  it("rejects an unauthenticated dashboard request", async () => {
    const response = await getDashboard(new NextRequest("http://localhost/api/dashboard"));
    expect(response.status).toBe(401);
  });

  it("toggles demo follows and rejects invalid targets", async () => {
    const invalidResponse = await postDashboard(
      jsonRequest("http://localhost/api/dashboard?demo=1", "POST", { targetUserId: "demo-user" })
    );
    expect(invalidResponse.status).toBe(400);

    const response = await postDashboard(
      jsonRequest("http://localhost/api/dashboard?demo=1", "POST", { targetUserId: "obs-test" })
    );
    expect(await responseJson(response)).toEqual({ following: true });
  });
});

describe("submission APIs", () => {
  it("lists submissions in timestamp order", async () => {
    mocks.supabaseResult = { data: [{ id: "row-1", plant_name: "Air Potato" }], error: null };
    const response = await getSubmissions();
    expect(response.status).toBe(200);
    expect(await responseJson(response)).toEqual([{ _id: "row-1", plantName: "Air Potato", timestamp: null }]);
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
    mocks.maybeSingleResult = { data: { id: validId, plant_name: "Air Potato" }, error: null };
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

describe("sighting APIs", () => {
  it("applies status and limit query parameters", async () => {
    mocks.supabaseResult = { data: [], error: null };
    const response = await getSightings(new NextRequest("http://localhost/api/sightings?status=verified&limit=5"));
    expect(response.status).toBe(200);
    expect(mocks.eq).toHaveBeenCalledWith("status", "verified");
    expect(mocks.limit).toHaveBeenCalledWith(5);
  });

  it("rejects unauthenticated or out-of-county sighting creation", async () => {
    const denied = await postSighting(
      jsonRequest("http://localhost/api/sightings", "POST", { lat: 29.6, lng: -82.3 })
    );
    expect(denied.status).toBe(401);

    mocks.auth.mockResolvedValue({ userId: "user-1" });
    const outside = await postSighting(
      jsonRequest("http://localhost/api/sightings", "POST", { lat: 30, lng: -82.3 })
    );
    expect(outside.status).toBe(400);
  });

  it("creates valid sightings as pending reports", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    mocks.single.mockResolvedValue({ data: { id: "created-1" }, error: null });
    const response = await postSighting(
      jsonRequest("http://localhost/api/sightings", "POST", {
        speciesId: "air_potato",
        lat: 29.65,
        lng: -82.32,
        notes: "Near trail",
      })
    );
    expect(response.status).toBe(200);
    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({
      user_id: "user-1",
      species_id: "air_potato",
      status: "pending",
    }));
  });

  it("returns 404 for a missing sighting", async () => {
    const response = await getSighting(
      new NextRequest(`http://localhost/api/sightings/${validId}`),
      context()
    );
    expect(response.status).toBe(404);
  });

  it("updates and deletes a sighting only when the owner checks pass", async () => {
    mocks.auth.mockResolvedValue({ userId: "user-1" });
    const denied = await putSighting(
      jsonRequest(`http://localhost/api/sightings/${validId}`, "PUT", { notes: "Updated" }),
      context()
    );
    expect(denied.status).toBe(403);

    mocks.canEditSighting.mockResolvedValue(true);
    mocks.supabaseResult = { data: [{ id: validId }], error: null };
    const updated = await putSighting(
      jsonRequest(`http://localhost/api/sightings/${validId}`, "PUT", { notes: "Updated" }),
      context()
    );
    expect(updated.status).toBe(200);
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ notes: "Updated" }));

    const deleteDenied = await deleteSighting(
      new NextRequest(`http://localhost/api/sightings/${validId}`, { method: "DELETE" }),
      context()
    );
    expect(deleteDenied.status).toBe(403);

    mocks.canDeleteSighting.mockResolvedValue(true);
    mocks.supabaseResult = { data: [{ id: validId }], error: null };
    const deleted = await deleteSighting(
      new NextRequest(`http://localhost/api/sightings/${validId}`, { method: "DELETE" }),
      context()
    );
    expect(deleted.status).toBe(200);
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
    const noImage = await identifyPlant(jsonRequest("http://localhost/api/identify-plant", "POST", {}));
    expect(noImage.status).toBe(400);

    vi.stubEnv("GEMINI_API_KEY", "");
    const noKey = await identifyPlant(
      jsonRequest("http://localhost/api/identify-plant", "POST", { image: "data:image/png;base64,AAAA" })
    );
    expect(noKey.status).toBe(500);
  });

  it("normalizes a known model prediction to catalog data", async () => {
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
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 503 })));
    const response = await identifyPlant(
      jsonRequest("http://localhost/api/identify-plant", "POST", { image: "data:image/png;base64,AAAA" })
    );
    expect(response.status).toBe(500);
    expect(await responseJson(response)).toEqual({ error: "Failed to analyze image" });
  });
});