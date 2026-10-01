import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.hoisted(() => vi.fn(() => ({})));
vi.mock("@supabase/supabase-js", () => ({ createClient }));

async function loadHelpers() {
  vi.resetModules();
  vi.stubEnv("SUPABASE_URL", "https://database.example.test");
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-service-key");
  return import("@/lib/supabase");
}

beforeEach(() => {
  vi.resetAllMocks();
});

describe("Supabase row helpers", () => {
  it("validates UUID primary keys", async () => {
    const { isValidId } = await loadHelpers();

    expect(isValidId("123e4567-e89b-42d3-a456-426614174000")).toBe(true);
    expect(isValidId("not-a-uuid")).toBe(false);
    expect(isValidId("")).toBe(false);
  });

  it("maps submission rows to the frontend API shape", async () => {
    const { toSubmission } = await loadHelpers();
    const row = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      plant_name: "Air Potato",
      scientific_name: "Dioscorea bulbifera",
      lat: 29.65,
      lng: -82.32,
      timestamp_ms: 1_700_000_000_000,
      notes: "By the trail",
      image_data: null,
      user_id: "user-1",
      created_by: "Observer",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: null,
      status: "approved" as const,
      approved_at: null,
      approved_by: null,
    };

    expect(toSubmission(row)).toMatchObject({
      _id: row.id,
      plantName: row.plant_name,
      scientificName: row.scientific_name,
      timestamp: row.timestamp_ms,
      userId: row.user_id,
      createdAt: row.created_at,
      status: row.status,
    });
  });

  it("maps sighting rows to the frontend API shape", async () => {
    const { toSighting } = await loadHelpers();
    const row = {
      id: "123e4567-e89b-42d3-a456-426614174000",
      species_id: "air_potato",
      lat: 29.65,
      lng: -82.32,
      location_accuracy_m: 5,
      address_approx: "Trailhead",
      observed_at: "2026-01-01T00:00:00.000Z",
      reported_at: "2026-01-01T00:01:00.000Z",
      notes: "By the trail",
      status: "pending",
      user_id: "user-1",
      created_by: "Observer",
      updated_at: null,
    };

    expect(toSighting(row)).toMatchObject({
      _id: row.id,
      speciesId: row.species_id,
      locationAccuracyM: row.location_accuracy_m,
      addressApprox: row.address_approx,
      observedAt: row.observed_at,
      reportedAt: row.reported_at,
      userId: row.user_id,
    });
  });
});