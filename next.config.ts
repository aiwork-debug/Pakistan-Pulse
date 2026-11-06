import type { NextConfig } from "next";

/** Supabase project host, so next/image can optimise covers from the public media bucket. */
function supabaseHost(): string | null {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

const host = supabaseHost();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // Local paths (public/demo/ photos and /demo-media/ uploads in demo mode) need no entry.
    remotePatterns: [
      ...(host ? [{ protocol: "https" as const, hostname: host, pathname: "/storage/v1/object/public/media/**" }] : []),
      // YouTube thumbnails, used as posters on video cards for stories without a cover photo.
      { protocol: "https", hostname: "i.ytimg.com", pathname: "/vi/**" },
    ],
  },
  experimental: {
    serverActions: {
      // Image uploads go through a server action and may be up to 5 MB.
      bodySizeLimit: "6mb",
    },
  },
};

export default nextConfig;
