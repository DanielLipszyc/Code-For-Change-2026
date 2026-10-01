import { createHash } from "crypto";
import { NextResponse } from "next/server";
import { supabase } from "./supabase";

const HOUR = 60 * 60;

/** Per-hour limits. Anonymous callers share a limit per IP address. */
export const LIMITS = {
  submitSignedIn: { limit: 30, windowSeconds: HOUR },
  submitAnonymous: { limit: 10, windowSeconds: HOUR },
  identifyPlant: { limit: 30, windowSeconds: HOUR },
} as const;

/**
 * Count one request against `key` and report whether it is still allowed.
 * Backed by the hit_rate_limit function in supabase/schema.sql, so limits hold
 * across server instances and restarts.
 */
export async function isWithinRateLimit(
  key: string,
  { limit, windowSeconds }: { limit: number; windowSeconds: number }
): Promise<boolean> {
  const { data, error } = await supabase.rpc("hit_rate_limit", {
    p_key: key,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    throw new Error(
      `Rate limit check failed (has supabase/schema.sql been re-run?): ${error.message}`
    );
  }
  return data === true;
}

/**
 * Rate-limit key for a caller without an account. The IP is hashed so raw
 * addresses are never stored. x-forwarded-for is set by the hosting proxy.
 */
export function anonymousKey(prefix: string, request: Request): string {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const hash = createHash("sha256").update(ip).digest("hex").slice(0, 32);
  return `${prefix}:ip:${hash}`;
}

export function tooManyRequests(windowSeconds: number) {
  return NextResponse.json(
    { error: "Too many requests. Please try again later." },
    { status: 429, headers: { "Retry-After": String(windowSeconds) } }
  );
}
