import type { NextConfig } from "next";

// Security headers applied to every route. Values are intentionally conservative
// — tighten further (e.g. stricter script-src via nonces) if/when the app can
// afford the migration away from Next.js' default inline scripts.
const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    // The explore map uses geolocation; nothing else needs camera/mic/payment.
    value: "geolocation=(self), camera=(), microphone=(), payment=(), usb=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js ships inline bootstrap scripts + React requires eval for some
      // build modes; scraped images and mapping libs use blob: workers.
      // Google Maps JS (via @vis.gl/react-google-maps) loads from
      // maps.googleapis.com + maps.gstatic.com; Draco decoder from www.gstatic.com.
      [
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
        "https://www.gstatic.com",
      ].join(" "),
      "worker-src 'self' blob:",
      "style-src 'self' 'unsafe-inline'",
      "font-src 'self' data:",
      // Images: scraped content and tile servers are on many origins.
      "img-src 'self' https: data: blob:",
      // Browser-side XHR / fetch / websocket endpoints.
      [
        "connect-src 'self'",
        "https://*.supabase.co",
        "https://basemaps.cartocdn.com",
        "https://*.basemaps.cartocdn.com",
        "https://www.gstatic.com",
        "https://maps.googleapis.com",
        "https://maps.gstatic.com",
      ].join(" "),
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  reactStrictMode: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
