import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import bundleAnalyzer from "@next/bundle-analyzer";
import withSerwistInit from "@serwist/next";

// Lockfiles in parent dirs (e.g. ~/package-lock.json) make Turbopack pick the wrong root
// and crash with "Failed to open database / invalid digit found in string".
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const withBundleAnalyzer = bundleAnalyzer({
    enabled: process.env.ANALYZE === "true",
});

const withSerwist = withSerwistInit({
    swSrc: "src/sw.ts",
    swDest: "public/sw.js",
    disable: process.env.NODE_ENV === "development" && process.env.NEXT_PUBLIC_PWA_ENABLED !== "true",
    register: false,
    reloadOnOnline: true,
    globPublicPatterns: ["icons/**/*", "logo.svg"],
});

const nextConfig: NextConfig = {
  turbopack: {
    root: projectRoot,
  },
  async redirects() {
    return [
      {
        source: "/dashboard/settings",
        destination: "/settings",
        permanent: true,
      },
      {
        source: "/dashboard/transactions",
        destination: "/transactions",
        permanent: true,
      },
      {
        source: "/dashboard/wallets",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/wallets",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/wallets/:path*",
        destination: "/dashboard",
        permanent: true,
      },
      {
        source: "/dashboard/categories",
        destination: "/categories",
        permanent: true,
      },
      {
        source: "/assets",
        destination: "/credit-cards",
        permanent: true,
      },
      {
        source: "/assets/:path*",
        destination: "/credit-cards",
        permanent: true,
      },
    ]
  },
};

export default withSerwist(withBundleAnalyzer(nextConfig));
