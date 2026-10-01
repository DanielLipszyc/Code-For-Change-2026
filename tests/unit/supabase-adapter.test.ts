import { beforeEach, describe, expect, it, vi } from "vitest";

const createClient = vi.hoisted(() => vi.fn());
vi.mock("@supabase/supabase-js", () => ({ createClient }));

const query: any = {
  data: [],
  error: null,
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  then: (resolve: (value: unknown) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve({ data: query.data, error: query.error }).then(resolve, reject),
};

const client = { from: vi.fn(() => query) };

async function loadDatabase() {
  vi.resetModules();
  const { getDb } = await import("@/lib/supabase");
  return getDb();
}

beforeEach(() => {
  vi.resetAllMocks();
  delete globalThis._supabaseClient;
  vi.stubEnv("SUPABASE_URL", "https://database.example.test");
  vi.stubEnv("SUPABASE_SECRET_KEY", "test-service-key");
  query.data = [];
  query.error = null;
  query.select.mockImplementation(() => query);
  query.eq.mockImplementation(() => query);
  query.order.mockImplementation(() => query);
  query.limit.mockImplementation(() => query);
  query.insert.mockImplementation(() => query);
  query.update.mockImplementation(() => query);
  query.delete.mockImplementation(() => query);
  query.maybeSingle.mockImplementation(async () => ({ data: query.data[0] ?? null, error: query.error }));
  client.from.mockImplementation(() => query);
  createClient.mockReturnValue(client);
});

describe("Supabase collection adapter", () => {
  it("requires database credentials", async () => {
    vi.stubEnv("SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    const db = await loadDatabase();

    await expect(db.collection("submissions").find().toArray()).rejects.toThrow(
      "Please define SUPABASE_URL and SUPABASE_SECRET_KEY"
    );
    expect(createClient).not.toHaveBeenCalled();
  });

  it("normalizes filters, sorting, limits, and returned row keys", async () => {
    query.data = [{ id: "row-1", created_at: "2026-01-02", timestamp_ms: 42, plant_name: "Air Potato" }];
    const db = await loadDatabase();
    const rows = await db.collection("submissions")
      .find({ _id: "row-1", createdAt: "2026-01-02" })
      .sort({ createdAt: -1, timestamp: 1 })
      .limit(5)
      .toArray();

    expect(client.from).toHaveBeenCalledWith("submissions");
    expect(query.eq).toHaveBeenCalledWith("id", "row-1");
    expect(query.eq).toHaveBeenCalledWith("created_at", "2026-01-02");
    expect(query.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(query.order).toHaveBeenCalledWith("timestamp_ms", { ascending: true });
    expect(query.limit).toHaveBeenCalledWith(5);
    expect(rows[0]).toMatchObject({ id: "row-1", createdAt: "2026-01-02", timestamp: 42 });
  });

  it("returns null for an absent row and the expected missing-row code", async () => {
    query.error = { code: "PGRST116" };
    const db = await loadDatabase();
    await expect(db.collection("submissions").findOne({ _id: "missing" })).resolves.toBeNull();
  });

  it("maps write fields and reports insert, update, and delete results", async () => {
    query.data = [{ id: "inserted-1" }];
    const db = await loadDatabase();
    const collection = db.collection("submissions");

    await expect(collection.insertOne({ plantName: "Air Potato", createdAt: "today" })).resolves.toMatchObject({
      insertedId: "inserted-1",
    });
    expect(query.insert).toHaveBeenCalledWith({ plant_name: "Air Potato", created_at: "today" });

    query.data = [{ id: "row-1" }];
    await expect(collection.updateOne({ _id: "row-1" }, { $set: { updatedAt: "tomorrow" } })).resolves.toEqual({
      matchedCount: 1,
      modifiedCount: 1,
    });
    expect(query.update).toHaveBeenCalledWith({ updated_at: "tomorrow" });
    expect(query.eq).toHaveBeenCalledWith("id", "row-1");

    await expect(collection.deleteOne({ _id: "row-1" })).resolves.toEqual({ deletedCount: 1 });
  });
});