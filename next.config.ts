import type { NextConfig } from "next";
import { developmentRequestHosts } from "./src/lib/dev-origins";

/**
 * Conservative response headers. No script/style CSP on purpose: Next.js
 * inline scripts, next/font, and MapLibre workers/tiles make a strict CSP
 * a separate, tested piece of work. `frame-ancestors` alone blocks framing.
 * Geolocation stays allowed for the "Use my location" search button.
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
  { key: "Permissions-Policy", value: "geolocation=(self), camera=(), microphone=(), payment=()" },
];

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  allowedDevOrigins: developmentRequestHosts(),
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
