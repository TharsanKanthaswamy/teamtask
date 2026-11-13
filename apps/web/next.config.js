/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@teamtrack/shared'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  async rewrites() {
    const backendUrl =
      process.env.BACKEND_API_URL ||
      (process.env.NEXT_PUBLIC_API_URL && !process.env.NEXT_PUBLIC_API_URL.includes('your-backend-api-url')
        ? process.env.NEXT_PUBLIC_API_URL.replace(/\/api\/v1\/?$/, '')
        : 'https://teamtask-c8fm.onrender.com');

    return [
      {
        source: '/api/v1/:path*',
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
