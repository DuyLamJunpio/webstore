import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * `next dev` serves its assets to localhost only; any other origin gets a 403
   * on /_next/static/chunks/*.js, which means React never hydrates and the whole
   * page becomes a dead screenshot. Opening the site from the LAN IP (phone,
   * second machine, `next dev -H 0.0.0.0`) needs that origin listed here.
   * Development only — it has no effect on `next build` / `next start`.
   */
  allowedDevOrigins: ["192.168.100.83", "*.local"],
};

export default nextConfig;
