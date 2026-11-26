import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  listCommunityFeed: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({ auth: mocks.auth }));
vi.mock("@/server/dashboard", () => ({
  listCommunityFeed: mocks.listCommunityFeed,
  toggleFollow: vi.fn(),
}));

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ userId: "user_me" });
  mocks.listCommunityFeed.mockResolvedValue({ feed: [], hasMoreFeed: false });
});

describe("GET /api/dashboard", () => {
  it("requires sign-in", async () => {
    mocks.auth.mockResolvedValue({ userId: null });
    const response = await GET(new NextRequest("http://localhost/api/dashboard"));
    expect(response.status).toBe(401);
    expect(mocks.listCommunityFeed).not.toHaveBeenCalled();
  });

  it("loads the requested page for the signed-in user", async () => {
    const response = await GET(new NextRequest("http://localhost/api/dashboard?offset=20"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ feed: [], hasMoreFeed: false });
    expect(mocks.listCommunityFeed).toHaveBeenCalledWith("user_me", 20);
  });

  it("rejects malformed or out-of-range offsets", async () => {
    for (const offset of ["-1", "1.5", "abc", "2147483647"]) {
      const response = await GET(
        new NextRequest(`http://localhost/api/dashboard?offset=${offset}`),
      );
      expect(response.status).toBe(400);
    }
    expect(mocks.listCommunityFeed).not.toHaveBeenCalled();
  });
});
