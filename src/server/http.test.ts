import { describe, expect, it } from "vitest";
import { z } from "zod";
import { jsonError, parseJsonBody } from "./http";

const schema = z.object({ name: z.string({ error: "name is required" }) });

const post = (body: BodyInit, headers: Record<string, string> = {}) =>
  new Request("http://localhost/api/test", { method: "POST", body, headers });

describe("parseJsonBody", () => {
  it("returns the validated data", async () => {
    const result = await parseJsonBody(
      post(JSON.stringify({ name: "Ana", extra: 1 })),
      schema,
      100,
    );
    expect(result).toEqual({ ok: true, data: { name: "Ana" } });
  });

  it("refuses a body whose declared length is over the limit without reading it", async () => {
    const result = await parseJsonBody(post("{}", { "content-length": "101" }), schema, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it("refuses a body that turns out to be over the limit while reading", async () => {
    const body = JSON.stringify({ name: "a".repeat(200) });
    const result = await parseJsonBody(post(body), schema, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it("answers 400 for invalid JSON", async () => {
    const result = await parseJsonBody(post("{not json"), schema, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      expect(await result.response.json()).toEqual({ error: "Request body must be valid JSON" });
    }
  });

  it("answers 400 with the first validation message", async () => {
    const result = await parseJsonBody(post("{}"), schema, 100);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(400);
      expect(await result.response.json()).toEqual({ error: "name is required" });
    }
  });
});

describe("jsonError", () => {
  it("uses the { error } shape every endpoint returns", async () => {
    const response = jsonError(404, "Submission not found");
    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Submission not found" });
  });
});
