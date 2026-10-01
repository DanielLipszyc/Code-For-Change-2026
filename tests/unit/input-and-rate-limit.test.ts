import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rpc: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ supabase: { rpc: mocks.rpc } }));

import {
  MAX_IMAGE_DATA_LENGTH,
  MAX_NOTES_LENGTH,
  parseImageData,
  parseNotes,
  resolvePlant,
  UNKNOWN_PLANT,
} from "@/lib/submissionInput";
import {
  LIMITS,
  anonymousKey,
  isWithinRateLimit,
  tooManyRequests,
} from "@/lib/rateLimit";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("submission input validation", () => {
  it("resolves known plants and accepted unknown aliases", () => {
    expect(resolvePlant(" Air Potato ")).toEqual({
      plantName: "Air Potato",
      scientificName: "Dioscorea bulbifera",
    });
    expect(resolvePlant("unknown")).toEqual({ plantName: UNKNOWN_PLANT, scientificName: null });
    expect(resolvePlant("unlisted plant")).toBeNull();
    expect(resolvePlant(null)).toBeNull();
  });

  it("trims notes and rejects invalid or oversized values", () => {
    expect(parseNotes(undefined)).toEqual({ value: null });
    expect(parseNotes("  near the trail  ")).toEqual({ value: "near the trail" });
    expect(parseNotes("   ")).toEqual({ value: null });
    expect(parseNotes(42)).toMatchObject({ error: "Notes must be text" });
    expect(parseNotes("x".repeat(MAX_NOTES_LENGTH + 1))).toMatchObject({
      error: `Notes must be ${MAX_NOTES_LENGTH} characters or fewer`,
    });
  });

  it("accepts bounded inline image data and rejects invalid or oversized images", () => {
    expect(parseImageData(undefined)).toEqual({ value: null });
    expect(parseImageData("data:image/png;base64,AAAA")).toEqual({
      value: "data:image/png;base64,AAAA",
    });
    expect(parseImageData("https://example.test/image.png")).toMatchObject({
      error: "Photo must be a JPEG, PNG or WebP image",
    });
    expect(parseImageData("x".repeat(MAX_IMAGE_DATA_LENGTH + 1))).toMatchObject({
      error: "Photo is too large",
    });
  });
});

describe("rate-limit helpers", () => {
  it("defines hourly submit and plant-identification limits", () => {
    expect(LIMITS.submitSignedIn).toEqual({ limit: 30, windowSeconds: 3600 });
    expect(LIMITS.submitAnonymous).toEqual({ limit: 10, windowSeconds: 3600 });
    expect(LIMITS.identifyPlant).toEqual({ limit: 30, windowSeconds: 3600 });
  });

  it("hashes anonymous IP addresses into stable, non-reversible keys", () => {
    const firstRequest = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.8, 10.0.0.1" },
    });
    const secondRequest = new Request("http://localhost", {
      headers: { "x-forwarded-for": "203.0.113.8" },
    });

    const firstKey = anonymousKey("submit", firstRequest);
    expect(firstKey).toMatch(/^submit:ip:[a-f0-9]{32}$/);
    expect(firstKey).toBe(anonymousKey("submit", secondRequest));
    expect(firstKey).not.toContain("203.0.113.8");
  });

  it("maps the database RPC result and reports database errors", async () => {
    mocks.rpc.mockResolvedValueOnce({ data: true, error: null });
    await expect(isWithinRateLimit("submit:user:user-1", LIMITS.submitSignedIn)).resolves.toBe(true);
    expect(mocks.rpc).toHaveBeenCalledWith("hit_rate_limit", {
      p_key: "submit:user:user-1",
      p_limit: 30,
      p_window_seconds: 3600,
    });

    mocks.rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(isWithinRateLimit("submit:user:user-1", LIMITS.submitSignedIn)).resolves.toBe(false);

    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: "database unavailable" } });
    await expect(isWithinRateLimit("submit:user:user-1", LIMITS.submitSignedIn)).rejects.toThrow(
      "Rate limit check failed"
    );
  });

  it("returns a 429 response with Retry-After", async () => {
    const response = tooManyRequests(120);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("120");
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests. Please try again later.",
    });
  });
});