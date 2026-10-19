import "server-only";
import { auth, clerkClient } from "@clerk/nextjs/server";
import type { UserRole, Viewer } from "@/types/auth";

// Ownership checks live in the queries themselves (server/submissions.ts)
export type { Viewer };

/**
 * Name shown to other users. Never falls back to the email address,
 * because stored names are returned by public endpoints.
 */
export function getPublicDisplayName(
  user: { firstName: string | null; lastName: string | null; username: string | null },
  { includeLastName = false, fallback = "Observer" } = {},
): string {
  const name = includeLastName
    ? [user.firstName, user.lastName].filter(Boolean).join(" ")
    : user.firstName;
  return name || user.username || fallback;
}

/** Role from a user's Clerk public metadata. Anything but "admin" is a regular user. */
export function roleOf(user: { publicMetadata: Record<string, unknown> }): UserRole {
  return user.publicMetadata.role === "admin" ? "admin" : "user";
}

/**
 * Role from the session token, when the Clerk session token is customized to
 * include public metadata (see docs/ARCHITECTURE.md). Undefined when it
 * isn't, so the caller can ask Clerk's API instead.
 */
export function roleFromSessionClaims(
  claims: { metadata?: { role?: unknown } } | null | undefined,
): UserRole | undefined {
  if (!claims?.metadata) return undefined;
  return claims.metadata.role === "admin" ? "admin" : "user";
}

/**
 * A user's current role from Clerk's API. Always up to date but costs a
 * network call, so it's used for admin-only actions (approving, deleting
 * other people's reports). Falls back to "user", never "admin", on errors.
 */
export async function getUserRole(userId: string): Promise<UserRole> {
  try {
    const client = await clerkClient();
    return roleOf(await client.users.getUser(userId));
  } catch (error) {
    console.error("Error fetching user role:", error);
    return "user";
  }
}

export async function isAdmin(userId: string): Promise<boolean> {
  return (await getUserRole(userId)) === "admin";
}

/**
 * The user behind the current request. The role comes from the session token
 * when it carries one (no network call, but a role change takes effect only
 * when the token refreshes, within about a minute), otherwise from Clerk's API.
 */
export async function getViewer(): Promise<Viewer> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return { userId: null, isAdmin: false };

  const role = roleFromSessionClaims(sessionClaims) ?? (await getUserRole(userId));
  return { userId, isAdmin: role === "admin" };
}
