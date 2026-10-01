import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }));

vi.mock("./supabase", () => ({ supabase: { rpc } }));

import { anonymousKey, isWithinRateLimit, tooManyRequests } from "./rateLimit";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("isWithinRateLimit", () => {
  const limit = { limit: 10, windowSeconds: 3600 };

  it("counts the hit in the database and reports that it's allowed", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await expect(isWithinRateLimit("submit:user:abc", limit)).resolves.toBe(true);
    expect(rpc).toHaveBeenCalledWith("hit_rate_limit", {
      p_key: "submit:user:abc",
      p_limit: 10,
      p_window_seconds: 3600,
    });
  });

  it("reports when the limit is used up", async () => {
    rpc.mockResolvedValue({ data: false, error: null });
    await expect(isWithinRateLimit("submit:user:abc", limit)).resolves.toBe(false);
  });

  it("throws instead of letting the request through when the check fails", async () => {
    rpc.mockResolvedValue({ data: null, error: { message: "function does not exist" } });
    await expect(isWithinRateLimit("submit:user:abc", limit)).rejects.toThrow(
      /Rate limit check failed/,
    );
  });
});

describe("anonymousKey", () => {
  const requestWith = (headers: Record<string, string>) =>
    new Request("http://localhost/api/submissions", { headers });

  it("keys on the first forwarded address and never stores the raw IP", () => {
    const key = anonymousKey("submit", requestWith({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }));
    expect(key).toMatch(/^submit:ip:[0-9a-f]{32}$/);
    expect(key).not.toContain("203.0.113.7");
    expect(key).toBe(anonymousKey("submit", requestWith({ "x-forwarded-for": "203.0.113.7" })));
  });

  it("gives different addresses different keys", () => {
    expect(anonymousKey("submit", requestWith({ "x-forwarded-for": "203.0.113.7" }))).not.toBe(
      anonymousKey("submit", requestWith({ "x-forwarded-for": "203.0.113.8" })),
    );
  });

  it("falls back to x-real-ip", () => {
    expect(anonymousKey("submit", requestWith({ "x-real-ip": "203.0.113.7" }))).toBe(
      anonymousKey("submit", requestWith({ "x-forwarded-for": "203.0.113.7" })),
    );
  });
});

describe("tooManyRequests", () => {
  it("responds 429 with a Retry-After header", () => {
    const response = tooManyRequests(3600);
    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("3600");
  });
});
