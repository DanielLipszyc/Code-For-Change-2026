// Sent with every response.
// The CSP only restricts framing, plugins and <base>: a full script-src policy
// needs nonces for Clerk's scripts and should be added and tested separately.
const securityHeaders = [
  // Stop other sites from embedding the app (clickjacking the admin map's approve/delete)
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'",
  },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  // The submit page uses the camera (photo input) and location; nothing uses the microphone
  { key: "Permissions-Policy", value: "camera=(self), geolocation=(self), microphone=()" },
  // Browsers ignore this over plain HTTP, so local development is unaffected
  { key: "Strict-Transport-Security", value: "max-age=63072000" },
];

import withSerwistInit from "@serwist/next";

// Builds the service worker (src/app/sw.ts) into public/sw.js. Off in
// development, where it would serve stale pages while you edit them.
const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  // A reload would throw away a half-filled form; SavedReportsSync sends
  // saved reports when the connection returns instead
  reloadOnOnline: false,
  // Precache only what every page needs, not the large photos in public/
  globPublicPatterns: ["icons/*", "logo.png", "manifest.json"],
  // Builds on Windows list public files with backslashes ("/icons\icon.png")
  manifestTransforms: [
    async (entries) => ({
      manifest: entries.map((entry) => ({ ...entry, url: entry.url.replaceAll("\\", "/") })),
      warnings: [],
    }),
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    return [
      // "What People Found" became the map's List view
      { source: "/sightings", destination: "/map?view=list", permanent: true },
      // Offline mode is part of the submit page now
      { source: "/offline-submit", destination: "/submit", permanent: true },
    ];
  },
};

export default withSerwist(nextConfig);
