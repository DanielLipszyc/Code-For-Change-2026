import { createClient, SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

declare global {
  var _supabaseClient: SupabaseClient | undefined;
}

function getSupabaseClient(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Please define SUPABASE_URL and SUPABASE_SECRET_KEY in your environment before using the database."
    );
  }

  if (!globalThis._supabaseClient) {
    globalThis._supabaseClient = createClient(url, serviceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  return globalThis._supabaseClient;
}

function toSnakeCase(value: string) {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .replace(/-/g, "_")
    .toLowerCase();
}

function toCamelCase(value: string) {
  return value.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase());
}

function normalizeDbKey(key: string) {
  if (key === "_id" || key === "id") return "id";
  if (key === "createdAt") return "created_at";
  if (key === "updatedAt") return "updated_at";
  if (key === "timestamp") return "timestamp_ms";
  return toSnakeCase(key);
}

function normalizeAppKey(key: string) {
  if (key === "created_at") return "createdAt";
  if (key === "updated_at") return "updatedAt";
  if (key === "timestamp_ms") return "timestamp";
  return toCamelCase(key);
}

function normalizeQuery(filter: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(filter).map(([key, value]) => {
      if (key === "_id" || key === "id") return ["id", value];
      return [normalizeDbKey(key), value];
    })
  );
}

function normalizeDbPayload(row: Record<string, unknown> = {}) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (key === "_id" || key === "id") return ["id", value];
      return [normalizeDbKey(key), value];
    })
  );
}

function normalizeRow(row: Record<string, unknown> = {}) {
  const normalized = Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (key === "_id") return ["_id", value];
      if (key === "id") return ["id", value];
      return [normalizeAppKey(key), value];
    })
  );

  if (!normalized.id && normalized._id) {
    return { ...normalized, id: String(normalized._id) };
  }

  return normalized;
}

class QueryBuilder {
  private table: string;
  private query: Record<string, unknown>;
  private sortFields: Record<string, number> = {};
  private limitValue?: number;

  constructor(table: string, query: Record<string, unknown> = {}) {
    this.table = table;
    this.query = normalizeQuery(query);
  }

  sort(sortFields: Record<string, number>) {
    this.sortFields = Object.fromEntries(
      Object.entries(sortFields).map(([key, value]) => [normalizeDbKey(key), value])
    );
    return this;
  }

  limit(value: number) {
    this.limitValue = value;
    return this;
  }

  async toArray() {
    let request = getSupabaseClient().from(this.table).select("*");

    Object.entries(this.query).forEach(([key, value]) => {
      request = request.eq(key, value as never);
    });

    Object.entries(this.sortFields).forEach(([key, direction]) => {
      request = request.order(key, { ascending: direction !== -1 });
    });

    if (this.limitValue) {
      request = request.limit(this.limitValue);
    }

    const { data, error } = await request;
    if (error) throw error;

    return (data ?? []).map((row) => normalizeRow(row as Record<string, unknown>));
  }
}

class CollectionAdapter {
  private table: string;

  constructor(table: string) {
    this.table = table;
  }

  find(query: Record<string, unknown> = {}) {
    return new QueryBuilder(this.table, query);
  }

  async findOne(query: Record<string, unknown> = {}) {
    let request = getSupabaseClient().from(this.table).select("*");
    const normalizedQuery = normalizeQuery(query);

    Object.entries(normalizedQuery).forEach(([key, value]) => {
      request = request.eq(key, value as never);
    });

    const { data, error } = await request.maybeSingle();
    if (error && error.code !== "PGRST116") throw error;

    return data ? normalizeRow(data as Record<string, unknown>) : null;
  }

  async insertOne(doc: Record<string, unknown>) {
    const normalized = normalizeDbPayload(doc);
    const { data, error } = await getSupabaseClient().from(this.table).insert(normalized).select();
    if (error) throw error;

    const row = data?.[0] ?? normalized;
    return {
      insertedId: String(row.id ?? row._id ?? crypto.randomUUID()),
      ...row,
    };
  }

  async updateOne(filter: Record<string, unknown>, update: Record<string, unknown>) {
    const payload = (update as any).$set ?? update;
    const normalizedFilter = normalizeQuery(filter);
    const normalizedPayload = normalizeDbPayload(payload);

    let request = getSupabaseClient().from(this.table).update(normalizedPayload);
    Object.entries(normalizedFilter).forEach(([key, value]) => {
      request = request.eq(key, value as never);
    });

    const { data, error } = await request.select();
    if (error) throw error;

    return {
      matchedCount: data?.length ?? 0,
      modifiedCount: data?.length ?? 0,
    };
  }

  async deleteOne(filter: Record<string, unknown>) {
    const normalizedFilter = normalizeQuery(filter);
    let request = getSupabaseClient().from(this.table).delete();

    Object.entries(normalizedFilter).forEach(([key, value]) => {
      request = request.eq(key, value as never);
    });

    const { data, error } = await request.select();
    if (error) throw error;

    return {
      deletedCount: data?.length ?? 0,
    };
  }
}

export async function getDb() {
  return {
    collection: (table: string) => new CollectionAdapter(table),
  };
}

export default getDb;