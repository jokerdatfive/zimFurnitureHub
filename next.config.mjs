/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.1.147'],
  async rewrites() {
    return [
      {
        source: '/webhook',
        destination: '/api/whatsapp/webhook',
      },
      {
        source: '/api/webhook',
        destination: '/api/whatsapp/webhook',
      },
    ];
  },
};

export default nextConfig;
