import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // DummyJSON already serves small WebP (~10 KB thumbnails, ~60 KB full), so
    // re-optimizing gains little and would burn the Vercel Hobby transformation quota.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.dummyjson.com",
        pathname: "/product-images/**",
      },
    ],
  },
};

export default nextConfig;
