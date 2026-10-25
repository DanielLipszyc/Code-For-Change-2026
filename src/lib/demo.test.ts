import { describe, expect, it } from "vitest";
import { demoDashboard, isDemoEnabled } from "./demo";

describe("local demo", () => {
  it("is enabled only for development environments", () => {
    expect(isDemoEnabled("development")).toBe(true);
    expect(isDemoEnabled("production")).toBe(false);
    expect(isDemoEnabled("test")).toBe(false);
    expect(isDemoEnabled(undefined)).toBe(false);
  });

  it("provides complete dashboard data without a real user or database", () => {
    expect(demoDashboard.user.id).toBe("demo-user");
    expect(demoDashboard.summary.pendingReview).toBeGreaterThan(0);
    expect(demoDashboard.stats).not.toHaveLength(0);
    expect(demoDashboard.observers).not.toHaveLength(0);
  });
});
