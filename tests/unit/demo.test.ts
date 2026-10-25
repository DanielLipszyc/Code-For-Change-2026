import { NextRequest } from "next/server";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  supabaseFrom: vi.fn(),
  getPublicDisplayName: vi.fn(),
  toSubmission: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mocks.auth,
  clerkClient: vi.fn(),
}));
vi.mock("@/lib/supabase", () => ({
  supabase: { from: mocks.supabaseFrom },
  toSubmission: mocks.toSubmission,
}));
vi.mock("@/lib/auth", () => ({
  getPublicDisplayName: mocks.getPublicDisplayName,
}));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
  vi.clearAllMocks();
});

describe("demo environment gate", () => {
  it("enables the demo only in development", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    const productionDemo = await import("@/lib/demo");
    expect(productionDemo.DEMO_ENABLED).toBe(false);

    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    const developmentDemo = await import("@/lib/demo");
    expect(developmentDemo.DEMO_ENABLED).toBe(true);
  });

  it("serves sample dashboard data for a demo cookie in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.resetModules();
    mocks.auth.mockResolvedValue({ userId: null });
    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET(new NextRequest("http://localhost/api/dashboard", {
      headers: { cookie: "demo_user=1" },
    }));

    expect(response.status).toBe(200);
    expect((await response.json()).user.id).toBe("demo-user");
  });

  it("rejects a demo cookie in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.resetModules();
    mocks.auth.mockResolvedValue({ userId: null });
    const { GET } = await import("@/app/api/dashboard/route");

    const response = await GET(new NextRequest("http://localhost/api/dashboard", {
      headers: { cookie: "demo_user=1" },
    }));

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Unauthorized" });
  });
});
