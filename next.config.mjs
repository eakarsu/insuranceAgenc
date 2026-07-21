/** @type {import('next').NextConfig} */
const allowedOrigin = process.env.CORS_ALLOWED_ORIGIN || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000');
if (!allowedOrigin) throw new Error('CORS_ALLOWED_ORIGIN is required in production');

const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: process.cwd(),
  transpilePackages: ['jose'],
  serverExternalPackages: ["@prisma/client", "bcryptjs", "puppeteer-core", "@sparticuz/chromium", "node-cron"],
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Env-driven CORS for API routes — set CORS_ORIGIN to lock down.
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: allowedOrigin },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,PATCH,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type,Authorization,X-Requested-With,Idempotency-Key' },
        ],
      },
    ];
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  modularizeImports: {
    '@mui/icons-material': {
      transform: '@mui/icons-material/{{member}}',
    },
    '@mui/material': {
      transform: '@mui/material/{{member}}',
    },
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('node-cron', 'puppeteer-core', '@sparticuz/chromium', 'twilio');
    }
    return config;
  },
};

export default nextConfig;
