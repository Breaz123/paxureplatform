import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Skip static generation for pages that require auth
  experimental: {
    // This helps with Supabase integration
  },
};

export default nextConfig;
