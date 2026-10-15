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

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
