/// <reference lib="webworker" />
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, NetworkFirst, Serwist, StaleWhileRevalidate } from "serwist";

/**
 * The service worker (built to public/sw.js by @serwist/next). It lets
 * Swamp Spotter open without a signal:
 *
 * - The app's scripts, styles and fonts are precached at install.
 * - Pages are fetched from the network first and kept, so a page opened
 *   once works offline after. /submit and /drafts require sign-in, so they
 *   can't be precached; SavedReportsSync asks for them
 *   (CACHE_SIGNED_IN_PAGES) once someone is signed in.
 * - A page never opened before shows /~offline.
 *
 * API responses are never cached: they depend on who's signed in. Map tiles
 * aren't either; OpenStreetMap doesn't allow storing them for offline use.
 */

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const PAGES_CACHE = "pages";
const OFFLINE_PAGE = "/~offline";

const pages = new NetworkFirst({
  cacheName: PAGES_CACHE,
  // On a weak signal, fall back to the saved page instead of waiting
  networkTimeoutSeconds: 4,
  plugins: [new ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 30 * 24 * 60 * 60 })],
});

const serwist = new Serwist({
  precacheEntries: [...(self.__SW_MANIFEST ?? []), { url: OFFLINE_PAGE, revision: null }],
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ request, sameOrigin }) => sameOrigin && request.mode === "navigate",
      handler: pages,
    },
    {
      matcher: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({ cacheName: "next-static" }),
    },
    {
      matcher: ({ url, sameOrigin }) =>
        sameOrigin &&
        (url.pathname.startsWith("/_next/image") ||
          /\.(?:png|jpe?g|webp|svg|ico)$/.test(url.pathname)),
      handler: new StaleWhileRevalidate({
        cacheName: "images",
        plugins: [new ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 30 * 24 * 60 * 60 })],
      }),
    },
  ],
  fallbacks: {
    entries: [{ url: OFFLINE_PAGE, matcher: ({ request }) => request.mode === "navigate" }],
  },
});

/** Pages for reporting in the field. They require sign-in, so they can't be precached. */
const SIGNED_IN_PAGES = ["/submit", "/drafts"];

/** Keep the signed-in pages, fetched as the signed-in user */
async function cacheSignedInPages() {
  const cache = await caches.open(PAGES_CACHE);
  await Promise.all(
    SIGNED_IN_PAGES.map(async (path) => {
      const url = new URL(path, self.location.origin);
      const response = await fetch(url, { credentials: "same-origin" });
      // A redirect means sign-in was needed: don't keep the sign-in page as /submit
      if (response.ok && !response.redirected) await cache.put(url, response);
    }),
  );
}

self.addEventListener("message", (event) => {
  // Only this site's own pages may ask
  if (event.origin !== self.location.origin) return;
  if ((event.data as { type?: unknown } | null)?.type === "CACHE_SIGNED_IN_PAGES") {
    event.waitUntil(cacheSignedInPages());
  }
});

serwist.addEventListeners();
