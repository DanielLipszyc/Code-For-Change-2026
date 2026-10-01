import { beforeEach, describe, expect, it, vi } from "vitest";

const { getUser, maybeSingle } = vi.hoisted(() => ({
  getUser: vi.fn(),
  maybeSingle: vi.fn(),
}));

vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { getUser } }),
}));

vi.mock("./db", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./db")>()),
  supabase: { from: () => ({ select: () => ({ eq: () => ({ maybeSingle }) }) }) },
}));

import { canDeleteSubmission, canEditSubmission, getPublicDisplayName, getUserRole } from "./authz";

const OWNER = "user_owner";
const OTHER = "user_other";
const ROW_ID = "3f2b8c1e-4d5a-4b6c-8d7e-9f0a1b2c3d4e";

const asAdmin = () => getUser.mockResolvedValue({ publicMetadata: { role: "admin" } });
const asRegularUser = () => getUser.mockResolvedValue({ publicMetadata: {} });
const rowOwnedBy = (userId: string | null) =>
  maybeSingle.mockResolvedValue({ data: { user_id: userId }, error: null });

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
    expect(getPublicDisplayName({ ...user, firstName: null })).toBe("ana_l");
    expect(getPublicDisplayName({ firstName: null, lastName: null, username: null })).toBe(
      "Observer",
    );
    expect(
      getPublicDisplayName(
        { firstName: null, lastName: null, username: null },
        { fallback: "Anonymous" },
      ),
    ).toBe("Anonymous");
  });
});

describe("getUserRole", () => {
  it("returns the role stored in Clerk public metadata", async () => {
    asAdmin();
    await expect(getUserRole(OWNER)).resolves.toBe("admin");
  });

  it("defaults to user when no role is set", async () => {
    asRegularUser();
    await expect(getUserRole(OWNER)).resolves.toBe("user");
  });

  it("falls back to user, never admin, when Clerk fails", async () => {
    getUser.mockRejectedValue(new Error("Clerk unavailable"));
    await expect(getUserRole(OWNER)).resolves.toBe("user");
  });
});

describe("canEditSubmission", () => {
  it("allows the owner", async () => {
    rowOwnedBy(OWNER);
    await expect(canEditSubmission(OWNER, ROW_ID)).resolves.toBe(true);
  });

  it("refuses everyone else, including admins", async () => {
    rowOwnedBy(OWNER);
    asAdmin();
    await expect(canEditSubmission(OTHER, ROW_ID)).resolves.toBe(false);
  });

  it("refuses anonymous submissions, which have no owner", async () => {
    rowOwnedBy(null);
    await expect(canEditSubmission(OTHER, ROW_ID)).resolves.toBe(false);
  });

  it("refuses submissions that don't exist", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(canEditSubmission(OWNER, ROW_ID)).resolves.toBe(false);
  });

  it("refuses malformed IDs without querying the database", async () => {
    await expect(canEditSubmission(OWNER, "not-a-uuid")).resolves.toBe(false);
    expect(maybeSingle).not.toHaveBeenCalled();
  });

  it("refuses when the database lookup fails", async () => {
    maybeSingle.mockResolvedValue({ data: null, error: new Error("connection lost") });
    await expect(canEditSubmission(OWNER, ROW_ID)).resolves.toBe(false);
  });
});

describe("canDeleteSubmission", () => {
  it("lets admins delete any submission", async () => {
    asAdmin();
    rowOwnedBy(OWNER);
    await expect(canDeleteSubmission(OTHER, ROW_ID)).resolves.toBe(true);
  });

  it("lets owners delete their own", async () => {
    asRegularUser();
    rowOwnedBy(OWNER);
    await expect(canDeleteSubmission(OWNER, ROW_ID)).resolves.toBe(true);
  });

  it("refuses other users", async () => {
    asRegularUser();
    rowOwnedBy(OWNER);
    await expect(canDeleteSubmission(OTHER, ROW_ID)).resolves.toBe(false);
  });
});
