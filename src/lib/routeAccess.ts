/**
 * Which requests the middleware lets through without sign-in. Everything else
 * requires it. This is only the first layer: every API handler also checks
 * the user itself.
 */

// /~offline is the service worker's fallback page, precached at install.
// /manifest.json is the web app manifest (the middleware runs for .json files).
const PUBLIC_PAGES = new Set(["/", "/about", "/guide", "/map", "/~offline", "/manifest.json"]);
const AUTH_PAGES = /^\/(sign-in|sign-up)(\/|$)/;

/** /api/submissions, /api/submissions/<id> and /api/submissions/<id>/photo */
const SUBMISSIONS_READ = /^\/api\/submissions(\/[^/]+(\/photo)?)?$/;

export function isPublicRequest(method: string, pathname: string): boolean {
  if (PUBLIC_PAGES.has(pathname) || AUTH_PAGES.test(pathname)) return true;

  // Reading approved submissions is public; the handlers hide pending ones
  if ((method === "GET" || method === "HEAD") && SUBMISSIONS_READ.test(pathname)) return true;

  // Anonymous submissions; the handler applies a per-IP rate limit
  if (method === "POST" && pathname === "/api/submissions") return true;

  return false;
}
