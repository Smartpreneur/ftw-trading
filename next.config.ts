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
  async headers() {
    const allowedOrigin = process.env.EMBED_ALLOWED_ORIGIN ?? '*'
    return [
      {
        // Allow /performance to be embedded as iFrame from the configured origin
        source: '/performance',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: `frame-ancestors 'self' ${allowedOrigin}`,
          },
        ],
      },
    ]
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
