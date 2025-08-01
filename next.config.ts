import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'avatars.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Production optimizations
  serverExternalPackages: ['@prisma/client'],
  // API route optimizations
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
        ],
      },
    ];
  },
  // Vercel-specific optimizations
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
  // Optimize for serverless
  ...(process.env.NODE_ENV === 'production' && {
    output: 'standalone',
  }),
  // Environment-specific settings
  ...(process.env.NODE_ENV === 'production' && {
    // Production-specific optimizations
    compress: true,
    poweredByHeader: false,
  }),
};

export default nextConfig;
