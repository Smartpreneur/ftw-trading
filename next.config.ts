import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'qkzykisktzotjmjenznl.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async redirects() {
    return [
      // /landing → / (Query-Parameter wie ?ref=y26 werden automatisch erhalten)
      {
        source: '/landing',
        destination: '/',
        permanent: false,
      },
    ]
  },
};

export default nextConfig;
