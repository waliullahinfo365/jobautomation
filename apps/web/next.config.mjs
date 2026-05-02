/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  // Disable Strict Mode in development to prevent useEffect double-invocation
  // which would cause every mounted page to fire its API calls twice.
  reactStrictMode: false,
  experimental: {
    // Only enable in production builds — avoids dev instability (chunk 404s) after
    // config reloads; `instrumentation.ts` still runs on `next build` / `next start`.
    ...(isProd ? { instrumentationHook: true } : {}),
    serverComponentsExternalPackages: ["mongoose"],
    externalDir: true
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" }
    ]
  }
};

export default nextConfig;
