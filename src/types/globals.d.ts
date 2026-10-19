export {};

declare global {
  /** Extra claims in the Clerk session token (see docs/ARCHITECTURE.md) */
  interface CustomJwtSessionClaims {
    /** The user's public metadata, when the session token is customized to include it */
    metadata?: { role?: unknown };
  }
}
