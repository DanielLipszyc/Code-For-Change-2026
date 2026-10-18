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
 *   can't be precached; SavedReportsSync asks for them (CACHE_PAGES) once
 *   someone is signed in.
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

/** Keep the given same-origin pages, fetched as the signed-in user */
async function cachePages(urls: string[]) {
  const cache = await caches.open(PAGES_CACHE);
  await Promise.all(
    urls.map(async (path) => {
      const url = new URL(path, self.location.origin);
      if (url.origin !== self.location.origin) return;
      const response = await fetch(url, { credentials: "same-origin" });
      // A redirect means sign-in was needed: don't keep the sign-in page as /submit
      if (response.ok && !response.redirected) await cache.put(url, response);
    }),
  );
}

self.addEventListener("message", (event) => {
  const data = event.data as { type?: string; urls?: unknown } | null;
  if (data?.type === "CACHE_PAGES" && Array.isArray(data.urls)) {
    event.waitUntil(cachePages(data.urls.filter((u): u is string => typeof u === "string")));
  }
});

serwist.addEventListeners();
