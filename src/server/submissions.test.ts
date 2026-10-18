import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A stand-in for the Supabase client that records each query-builder call
 * and resolves every query to `state.result`.
 */
const state = vi.hoisted(() => ({
  calls: [] as [string, unknown[]][],
  result: { data: null as unknown, error: null as unknown },
}));

vi.mock("./db", () => {
  const builder: Record<string, unknown> = {
    then: (resolve: (value: unknown) => void) => resolve(state.result),
  };
  for (const method of [
    "select",
    "eq",
    "or",
    "order",
    "delete",
    "update",
    "insert",
    "maybeSingle",
  ]) {
    builder[method] = (...args: unknown[]) => {
      state.calls.push([method, args]);
      return builder;
    };
  }
  return { supabase: { from: () => builder } };
});

// No Next.js cache in unit tests: cached functions run every time, and
// invalidations are recorded
const revalidateTag = vi.hoisted(() => vi.fn());
vi.mock("next/cache", () => ({
  revalidateTag,
  unstable_cache: <T>(fn: T) => fn,
}));

import {
  DuplicateSubmissionError,
  approveSubmission,
  createSubmission,
  deleteSubmission,
  getPhoto,
  getSubmission,
  listPublicMapPoints,
  listSubmissions,
  updateOwnSubmission,
} from "./submissions";

const ID = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";
const OWNER = "user_owner";
const signedOut = { userId: null, isAdmin: false };
const owner = { userId: OWNER, isAdmin: false };
const stranger = { userId: "user_other", isAdmin: false };
const admin = { userId: "user_admin", isAdmin: true };

const row = (overrides: Record<string, unknown> = {}) => ({
  id: ID,
  plant_name: "Air Potato",
  scientific_name: "Dioscorea bulbifera",
  lat: 29.65,
  lng: -82.32,
  location_accuracy_m: 8,
  timestamp_ms: 1767225600000,
  notes: null,
  user_id: OWNER,
  created_by: "Ana",
  created_at: "2026-01-01T00:00:00Z",
  updated_at: null,
  status: "approved",
  approved_at: "2026-01-02T00:00:00Z",
  ...overrides,
});

const callsTo = (method: string) => state.calls.filter(([name]) => name === method);
const respond = (data: unknown) => (state.result = { data, error: null });

beforeEach(() => {
  state.calls = [];
  respond(null);
  revalidateTag.mockClear();
});

describe("listSubmissions", () => {
  it("never selects the photo data", async () => {
    respond([]);
    await listSubmissions(admin);
    const [[, [columns]]] = callsTo("select");
    expect(columns).not.toContain("image_data");
  });

  it("shows signed-out visitors approved submissions only", async () => {
    respond([]);
    await listSubmissions(signedOut);
    expect(callsTo("eq")).toEqual([["eq", ["status", "approved"]]]);
    expect(callsTo("or")).toEqual([]);
  });

  it("shows signed-in users approved submissions plus their own", async () => {
    respond([]);
    await listSubmissions(owner);
    expect(callsTo("or")).toEqual([["or", [`status.eq.approved,user_id.eq.${OWNER}`]]]);
  });

  it("never puts an unexpected user ID into the filter string", async () => {
    respond([]);
    await listSubmissions({ userId: "x,status.eq.pending", isAdmin: false });
    expect(callsTo("or")).toEqual([]);
    expect(callsTo("eq")).toEqual([["eq", ["status", "approved"]]]);
  });

  it("shows admins everything", async () => {
    respond([]);
    await listSubmissions(admin);
    expect(callsTo("eq")).toEqual([]);
    expect(callsTo("or")).toEqual([]);
  });

  it("with status, adds that filter on top of the visibility rules", async () => {
    respond([]);
    await listSubmissions(admin, { status: "pending" });
    expect(callsTo("eq")).toEqual([["eq", ["status", "pending"]]]);

    state.calls = [];
    await listSubmissions(owner, { status: "pending" });
    expect(callsTo("eq")).toEqual([["eq", ["status", "pending"]]]);
    expect(callsTo("or")).toEqual([["or", [`status.eq.approved,user_id.eq.${OWNER}`]]]);
  });

  it("with mine, returns only the viewer's own and nothing when signed out", async () => {
    respond([]);
    await listSubmissions(owner, { mine: true });
    expect(callsTo("eq")).toEqual([["eq", ["user_id", OWNER]]]);

    state.calls = [];
    await expect(listSubmissions(signedOut, { mine: true })).resolves.toEqual([]);
    expect(state.calls).toEqual([]);
  });

  it("hides other people's user IDs but not the viewer's own", async () => {
    respond([row(), row({ user_id: "user_other" })]);
    const [own, theirs] = await listSubmissions(owner);
    expect(own.userId).toBe(OWNER);
    expect(theirs.userId).toBeNull();

    const forAdmin = await listSubmissions(admin);
    expect(forAdmin.map((s) => s.userId)).toEqual([OWNER, "user_other"]);
  });

  it("returns the API shape with a photo URL", async () => {
    respond([row({ timestamp_ms: "1767225600000" })]);
    const [submission] = await listSubmissions(signedOut);
    expect(submission).toMatchObject({
      id: ID,
      plantName: "Air Potato",
      timestamp: 1767225600000,
      photoUrl: `/api/submissions/${ID}/photo`,
      userId: null,
    });
  });
});

describe("listPublicMapPoints", () => {
  it("selects only what the map draws, from approved submissions", async () => {
    respond([row({ timestamp_ms: "1767225600000" })]);
    const points = await listPublicMapPoints();

    const [[, [columns]]] = callsTo("select");
    expect(columns).not.toMatch(/image_data|notes|user_id|created_by/);
    expect(callsTo("eq")).toEqual([["eq", ["status", "approved"]]]);
    expect(points).toEqual([
      {
        id: ID,
        plantName: "Air Potato",
        scientificName: "Dioscorea bulbifera",
        lat: 29.65,
        lng: -82.32,
        timestamp: 1767225600000,
        status: "approved",
      },
    ]);
  });
});

describe("createSubmission", () => {
  const input = {
    plantName: { plantName: "Air Potato", scientificName: "Dioscorea bulbifera" },
    lat: 29.65,
    lng: -82.32,
    locationAccuracyM: null,
    notes: null,
    imageData: null,
    anonymous: false,
  };
  const submitter = { userId: OWNER, displayName: "Ana", autoApprove: false };
  const inserted = () => callsTo("insert")[0][1][0] as Record<string, unknown>;

  it("stores the client's ID and spotted-at time when given", async () => {
    const observedAt = Date.now() - 60_000;
    await expect(createSubmission({ ...input, id: ID, observedAt }, submitter)).resolves.toBe(ID);
    expect(inserted()).toMatchObject({ id: ID, timestamp_ms: observedAt, status: "pending" });
  });

  it("otherwise makes up an ID and records the current time", async () => {
    const before = Date.now();
    const id = await createSubmission(input, submitter);
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    expect(inserted().timestamp_ms).toBeGreaterThanOrEqual(before);
  });

  it("reports an ID that's already stored as a duplicate, without clearing caches", async () => {
    state.result = { data: null, error: { code: "23505", message: "duplicate key" } };
    await expect(createSubmission({ ...input, id: ID }, submitter)).rejects.toEqual(
      new DuplicateSubmissionError(ID),
    );
    expect(revalidateTag).not.toHaveBeenCalled();
  });

  it("auto-approves only when told to", async () => {
    await createSubmission(input, { ...submitter, autoApprove: true });
    expect(inserted().status).toBe("approved");
  });
});

describe("cache invalidation", () => {
  it("clears cached lists after a change", async () => {
    respond([{ id: ID }]);
    await approveSubmission(ID, "user_admin");
    await deleteSubmission(ID, admin);
    await updateOwnSubmission(ID, OWNER, { notes: "x" }, { keepApproval: false });
    expect(revalidateTag).toHaveBeenCalledTimes(3);
    expect(revalidateTag).toHaveBeenCalledWith("submissions");
  });

  it("leaves them alone when nothing changed", async () => {
    respond([]);
    await approveSubmission(ID, "user_admin");
    await deleteSubmission(ID, owner);
    expect(revalidateTag).not.toHaveBeenCalled();
  });
});

describe("getSubmission", () => {
  it("hides pending submissions from everyone but the submitter and admins", async () => {
    respond(row({ status: "pending" }));
    await expect(getSubmission(ID, signedOut)).resolves.toBeNull();
    await expect(getSubmission(ID, stranger)).resolves.toBeNull();
    await expect(getSubmission(ID, owner)).resolves.toMatchObject({ id: ID });
    await expect(getSubmission(ID, admin)).resolves.toMatchObject({ id: ID });
  });

  it("returns null for malformed IDs without querying", async () => {
    await expect(getSubmission("not-a-uuid", admin)).resolves.toBeNull();
    expect(state.calls).toEqual([]);
  });
});

describe("getPhoto", () => {
  it("decodes the stored photo", async () => {
    respond({ status: "approved", user_id: OWNER, image_data: "data:image/png;base64,iVBORw==" });
    const photo = await getPhoto(ID, signedOut);
    expect(photo).toMatchObject({ contentType: "image/png", isPublic: true });
    expect(photo?.bytes).toEqual(Buffer.from("iVBORw==", "base64"));
  });

  it("follows the submission's visibility", async () => {
    respond({ status: "pending", user_id: OWNER, image_data: "data:image/jpeg;base64,/9j/" });
    await expect(getPhoto(ID, stranger)).resolves.toBeNull();
    await expect(getPhoto(ID, owner)).resolves.toMatchObject({ isPublic: false });
  });

  it("never serves formats that could run script", async () => {
    respond({
      status: "approved",
      user_id: OWNER,
      image_data: "data:image/svg+xml;base64,PHN2Zz4=",
    });
    await expect(getPhoto(ID, admin)).resolves.toBeNull();
  });

  it("returns null when there's no photo", async () => {
    respond({ status: "approved", user_id: OWNER, image_data: null });
    await expect(getPhoto(ID, admin)).resolves.toBeNull();
  });
});

describe("updateOwnSubmission", () => {
  it("only updates a row the user owns, checked in the same query", async () => {
    respond([{ id: ID }]);
    await expect(
      updateOwnSubmission(ID, OWNER, { notes: "edited" }, { keepApproval: false }),
    ).resolves.toBe(true);
    expect(callsTo("eq")).toEqual([
      ["eq", ["id", ID]],
      ["eq", ["user_id", OWNER]],
    ]);
  });

  it("sends the report back for review unless told to keep the approval", async () => {
    respond([{ id: ID }]);
    await updateOwnSubmission(ID, OWNER, { notes: "edited" }, { keepApproval: false });
    expect(callsTo("update")[0][1][0]).toMatchObject({
      notes: "edited",
      status: "pending",
      approved_at: null,
    });

    state.calls = [];
    await updateOwnSubmission(ID, OWNER, { notes: "edited" }, { keepApproval: true });
    expect(callsTo("update")[0][1][0]).not.toHaveProperty("status");
  });

  it("reports false when no row matched (missing, or someone else's)", async () => {
    respond([]);
    await expect(
      updateOwnSubmission(ID, "user_other", { notes: "x" }, { keepApproval: false }),
    ).resolves.toBe(false);
  });
});

describe("deleteSubmission", () => {
  it("limits regular users to their own submissions", async () => {
    respond([{ id: ID }]);
    await deleteSubmission(ID, owner);
    expect(callsTo("eq")).toEqual([
      ["eq", ["id", ID]],
      ["eq", ["user_id", OWNER]],
    ]);
  });

  it("lets admins delete any submission", async () => {
    respond([{ id: ID }]);
    await expect(deleteSubmission(ID, admin)).resolves.toBe(true);
    expect(callsTo("eq")).toEqual([["eq", ["id", ID]]]);
  });

  it("does nothing for signed-out users", async () => {
    await expect(deleteSubmission(ID, signedOut)).resolves.toBe(false);
    expect(state.calls).toEqual([]);
  });
});
