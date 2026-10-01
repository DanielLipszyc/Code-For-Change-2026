import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, auth } = vi.hoisted(() => ({ getUser: vi.fn(), auth: vi.fn() }));

vi.mock("@clerk/nextjs/server", () => ({
  auth,
  clerkClient: async () => ({ users: { getUser } }),
}));

import {
  getPublicDisplayName,
  getUserRole,
  getViewer,
  roleFromSessionClaims,
  roleOf,
} from "./authz";

beforeEach(() => {
  vi.resetAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("getPublicDisplayName", () => {
  const user = { firstName: "Ana", lastName: "Lopez", username: "ana_l" };

  it("uses the first name by default", () => {
    expect(getPublicDisplayName(user)).toBe("Ana");
  });

  it("adds the last name when asked", () => {
    expect(getPublicDisplayName(user, { includeLastName: true })).toBe("Ana Lopez");
  });

  it("falls back to the username, then to the fallback text", () => {
    const nameless = { firstName: null, lastName: null, username: null };
    expect(getPublicDisplayName({ ...user, firstName: null })).toBe("ana_l");
    expect(getPublicDisplayName(nameless)).toBe("Observer");
    expect(getPublicDisplayName(nameless, { fallback: "Anonymous" })).toBe("Anonymous");
  });
});

describe("roleOf", () => {
  it("treats only an exact admin role as admin", () => {
    expect(roleOf({ publicMetadata: { role: "admin" } })).toBe("admin");
    for (const role of [undefined, "user", "Admin", "superuser", true]) {
      expect(roleOf({ publicMetadata: { role } })).toBe("user");
    }
  });
});

describe("roleFromSessionClaims", () => {
  it("reads the role when the session token carries public metadata", () => {
    expect(roleFromSessionClaims({ metadata: { role: "admin" } })).toBe("admin");
    expect(roleFromSessionClaims({ metadata: {} })).toBe("user");
  });

  it("is undefined when the session token has no metadata", () => {
    expect(roleFromSessionClaims({})).toBeUndefined();
    expect(roleFromSessionClaims(null)).toBeUndefined();
  });
});

describe("getUserRole", () => {
  it("returns the role stored in Clerk public metadata", async () => {
    getUser.mockResolvedValue({ publicMetadata: { role: "admin" } });
    await expect(getUserRole("user_1")).resolves.toBe("admin");
  });

  it("falls back to user, never admin, when Clerk fails", async () => {
    getUser.mockRejectedValue(new Error("Clerk unavailable"));
    await expect(getUserRole("user_1")).resolves.toBe("user");
  });
});

describe("getViewer", () => {
  it("returns a signed-out viewer without calling Clerk", async () => {
    auth.mockResolvedValue({ userId: null, sessionClaims: null });
    await expect(getViewer()).resolves.toEqual({ userId: null, isAdmin: false });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("uses the role in the session token when there is one", async () => {
    auth.mockResolvedValue({ userId: "user_1", sessionClaims: { metadata: { role: "admin" } } });
    await expect(getViewer()).resolves.toEqual({ userId: "user_1", isAdmin: true });
    expect(getUser).not.toHaveBeenCalled();
  });

  it("asks Clerk when the session token has no role", async () => {
    auth.mockResolvedValue({ userId: "user_1", sessionClaims: {} });
    getUser.mockResolvedValue({ publicMetadata: { role: "admin" } });
    await expect(getViewer()).resolves.toEqual({ userId: "user_1", isAdmin: true });
  });
});
