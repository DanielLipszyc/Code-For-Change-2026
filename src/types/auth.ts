/**
 * User role types for authorization
 */
export type UserRole = "user" | "admin";

/**
 * Who is making a request: decides what they can see and change.
 * Built on the server by getViewer() in server/authz.ts.
 */
export interface Viewer {
  userId: string | null;
  isAdmin: boolean;
}
